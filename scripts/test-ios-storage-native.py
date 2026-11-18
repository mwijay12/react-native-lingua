#!/usr/bin/env python3
"""Compile the patched iOS storage logic with Foundation on a Mac runner.

React bridge functions are test stubs and only the path providers are redirected
into a temporary fixture directory. This also performs an iOS-simulator SDK
syntax check; it does not build or run the complete app on an iOS device.
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IOS = ROOT / "node_modules/@react-native-async-storage/async-storage/ios"
STUBS = ROOT / "tests/ios-native/stubs"
HARNESS = ROOT / "tests/ios-native/storage-harness.mm"


def run(*args):
    print("+", " ".join(map(str, args)), flush=True)
    subprocess.run([str(arg) for arg in args], check=True)


def main():
    if not shutil.which("xcrun"):
        raise SystemExit("Xcode command-line tools are required for this native test.")
    run("node", ROOT / "scripts/harden-async-storage.cjs")
    source = (IOS / "RNCAsyncStorage.mm").read_text()
    start_marker = "static NSString *RCTCreateStorageDirectoryPath_deprecated(NSString *storageDir)"
    end_marker = "static NSString *RCTGetStorageDirectory()"
    if source.count(start_marker) != 1 or source.count(end_marker) != 1:
        raise RuntimeError("Unexpected iOS source; refusing to rewrite test paths")
    start, end = source.index(start_marker), source.index(end_marker)
    providers = '''static NSString *RCTCreateStorageDirectoryPath_deprecated(NSString *storageDir)
{
    return [[TestRoot stringByAppendingPathComponent:@"old"] stringByAppendingPathComponent:storageDir];
}
static NSString *RCTCreateStorageDirectoryPath(NSString *storageDir)
{
    return [[TestRoot stringByAppendingPathComponent:@"current"] stringByAppendingPathComponent:storageDir];
}

'''
    with tempfile.TemporaryDirectory(prefix="lingua-ios-storage-build-") as temp:
        directory = Path(temp)
        (directory / "RNCAsyncStorage.test.mm").write_text(source[:start] + providers + source[end:])
        fixture = directory / "lingua-ios-storage-fixture"
        binary = directory / "storage-harness"
        common = ["-std=c++17", "-fobjc-arc", "-fblocks", "-I", STUBS, "-I", IOS, "-I", directory]
        run("xcrun", "--sdk", "macosx", "clang++", *common, HARNESS,
            "-framework", "Foundation", "-framework", "CoreFoundation", "-o", binary)
        run(binary, fixture)
        sdk = subprocess.check_output(["xcrun", "--sdk", "iphonesimulator", "--show-sdk-path"], text=True).strip()
        run("xcrun", "--sdk", "iphonesimulator", "clang++", *common, "-target", "arm64-apple-ios15.0-simulator",
            "-isysroot", sdk, "-fsyntax-only", HARNESS)
    print("iOS storage native logic and simulator-SDK syntax checks passed.", flush=True)


if __name__ == "__main__":
    main()
