// Exercises the real patched Objective-C storage implementation against a
// temporary directory using Foundation and tiny React bridge stubs. This is a
// native logic test, not a substitute for a real iOS app/device test.
#import <Foundation/Foundation.h>
#import <CommonCrypto/CommonDigest.h>
#import <React/RCTUtils.h>
#include <stdio.h>
#include <stdlib.h>

static NSString *TestRoot;

NSDictionary *RCTMakeError(NSString *message, id detail, NSDictionary *extra) {
    return @{ @"message": message ?: @"Error" };
}
NSDictionary *RCTMakeAndLogError(NSString *message, id detail, NSDictionary *extra) {
    return RCTMakeError(message, detail, extra);
}
NSDictionary *RCTJSErrorFromNSError(NSError *error) {
    return RCTMakeError(error.localizedDescription, error, nil);
}
NSString *RCTMD5Hash(NSString *value) {
    NSData *data = [value dataUsingEncoding:NSUTF8StringEncoding];
    unsigned char bytes[CC_MD5_DIGEST_LENGTH];
    CC_MD5(data.bytes, (CC_LONG)data.length, bytes);
    NSMutableString *hash = [NSMutableString string];
    for (NSUInteger i = 0; i < CC_MD5_DIGEST_LENGTH; ++i) [hash appendFormat:@"%02x", bytes[i]];
    return hash;
}
id RCTJSONParse(NSString *json, NSError **error) {
    return [NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding]
                                           options:NSJSONReadingFragmentsAllowed error:error];
}
id RCTJSONParseMutable(NSString *json, NSError **error) {
    return [NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding]
                                           options:NSJSONReadingMutableContainers | NSJSONReadingFragmentsAllowed
                                             error:error];
}
NSString *RCTJSONStringify(id value, NSError **error) {
    NSData *data = [NSJSONSerialization dataWithJSONObject:value options:0 error:error];
    return data ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : nil;
}

// Generated from the installed, hash-verified file; only its directory path
// helpers are replaced so no real home-directory files are read or written.
#include "RNCAsyncStorage.test.mm"

#define REQUIRE(condition, message) do { \
    if (!(condition)) { fprintf(stderr, "FAIL: %s\n", message); exit(1); } \
} while (0)

static void resetFixture(void) {
    NSFileManager *files = [NSFileManager defaultManager];
    [files removeItemAtPath:TestRoot error:nil];
    REQUIRE([files createDirectoryAtPath:TestRoot withIntermediateDirectories:YES attributes:nil error:nil], "create fixture");
    RCTHasCreatedStorageDirectory = NO;
    [RCTGetCache() removeAllObjects];
}
static NSString *targetDir(void) { return RCTGetStorageDirectory(); }
static NSString *manifestPath(void) { return [targetDir() stringByAppendingPathComponent:RCTManifestFileName]; }
static void makeDir(NSString *path) {
    REQUIRE([[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:YES
                                                       attributes:nil error:nil], "create directory");
}
static void writeString(NSString *value, NSString *path) {
    REQUIRE([value writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:nil], "write fixture file");
}
static NSArray *getItem(RNCAsyncStorage *storage, NSString *key) {
    __block NSArray *response = nil;
    [storage multiGet:@[key] callback:^(NSArray *result) { response = result; }];
    REQUIRE(response != nil, "get callback");
    return response;
}
static NSArray *setItem(RNCAsyncStorage *storage, NSString *key, NSString *value) {
    __block NSArray *response = nil;
    [storage multiSet:@[@[key, value]] callback:^(NSArray *result) { response = result; }];
    REQUIRE(response != nil, "set callback");
    return response;
}
static BOOL failed(NSArray *response) { return response[0] != (id)kCFNull; }
static id resultValue(NSArray *response) { return response[1][0][1]; }

static void testFreshStorage(void) {
    resetFixture();
    RNCAsyncStorage *storage = [RNCAsyncStorage new];
    REQUIRE(!failed(getItem(storage, @"language-storage")), "fresh read succeeds");
    REQUIRE(resultValue(getItem(storage, @"language-storage")) == (id)kCFNull, "fresh key absent");
    REQUIRE(!failed(setItem(storage, @"language-storage", @"sw")), "fresh write succeeds");
    REQUIRE([resultValue(getItem(storage, @"language-storage")) isEqual:@"sw"], "fresh value round trip");
    puts("iOS native: fresh storage round trip");
}

static void testInvalidManifests(void) {
    for (NSString *raw in @[@"not-json", @"[]", @"{\"learning-storage\":4}"]) {
        resetFixture();
        makeDir(targetDir());
        writeString(raw, manifestPath());
        RNCAsyncStorage *storage = [RNCAsyncStorage new];
        REQUIRE(failed(getItem(storage, @"learning-storage")), "invalid manifest read rejected");
        REQUIRE(failed(setItem(storage, @"other", @"value")), "invalid manifest write rejected");
        NSString *after = [NSString stringWithContentsOfFile:manifestPath() encoding:NSUTF8StringEncoding error:nil];
        REQUIRE([after isEqual:raw], "invalid manifest preserved");
    }
    puts("iOS native: corrupt and unexpected manifests preserved");
}

static void testMissingLargeValue(void) {
    resetFixture();
    makeDir(targetDir());
    writeString(@"{\"learning-storage\":null,\"language-storage\":\"sw\"}", manifestPath());
    RNCAsyncStorage *storage = [RNCAsyncStorage new];
    REQUIRE(failed(getItem(storage, @"learning-storage")), "missing external file rejected");
    REQUIRE(!failed(setItem(storage, @"other", @"value")), "unrelated write succeeds");
    NSDictionary *manifest = RCTJSONParse([NSString stringWithContentsOfFile:manifestPath()
                                                                      encoding:NSUTF8StringEncoding error:nil], nil);
    REQUIRE(manifest[@"learning-storage"] == (id)kCFNull, "missing file reference retained");
    REQUIRE([manifest[@"language-storage"] isEqual:@"sw"], "other saved value retained");
    puts("iOS native: missing external value blocks its read without erasing its reference");
}

static void testFailedWrites(void) {
    resetFixture();
    RNCAsyncStorage *storage = [RNCAsyncStorage new];
    NSString *largeA = [@"A" stringByPaddingToLength:1800 withString:@"A" startingAtIndex:0];
    NSString *largeB = [@"B" stringByPaddingToLength:1800 withString:@"B" startingAtIndex:0];
    REQUIRE(!failed(setItem(storage, @"learning-storage", largeA)), "save initial large value");
    NSString *external = [storage _filePathForKey:@"learning-storage"];
    REQUIRE([[NSFileManager defaultManager] fileExistsAtPath:external], "large value file exists");
    REQUIRE([resultValue(getItem(storage, @"learning-storage")) isEqual:largeA], "initial large value");
    NSFileManager *files = [NSFileManager defaultManager];
    REQUIRE([files setAttributes:@{NSFilePosixPermissions: @0500} ofItemAtPath:targetDir() error:nil], "make directory read-only");
    REQUIRE(failed(setItem(storage, @"learning-storage", largeB)), "failed external write is reported");
    REQUIRE([resultValue(getItem(storage, @"learning-storage")) isEqual:largeA], "failed external write does not poison cache");
    REQUIRE(failed(setItem(storage, @"learning-storage", @"small")), "failed manifest write is reported");
    REQUIRE([files fileExistsAtPath:external], "old large file retained after failed inline write");
    REQUIRE([files setAttributes:@{NSFilePosixPermissions: @0700} ofItemAtPath:targetDir() error:nil], "restore directory access");
    RNCAsyncStorage *reopened = [RNCAsyncStorage new];
    REQUIRE([resultValue(getItem(reopened, @"learning-storage")) isEqual:largeA], "failed write reopens old value");
    REQUIRE(!failed(setItem(reopened, @"learning-storage", @"small")), "inline retry succeeds");
    RNCAsyncStorage *again = [RNCAsyncStorage new];
    REQUIRE([resultValue(getItem(again, @"learning-storage")) isEqual:@"small"], "successful retry reopens new value");
    puts("iOS native: failed writes preserve old bytes and retry works");
}

static void testLegacyMigration(void) {
    resetFixture();
    NSString *old = RCTCreateStorageDirectoryPath_deprecated(RCTStorageDirectory);
    makeDir(old);
    NSString *oldManifest = [old stringByAppendingPathComponent:RCTManifestFileName];
    NSString *saved = @"{\"language-storage\":\"sw\"}";
    writeString(saved, oldManifest);
    RNCAsyncStorage *storage = [RNCAsyncStorage new];
    REQUIRE([resultValue(getItem(storage, @"language-storage")) isEqual:@"sw"], "single legacy location copied");
    REQUIRE([[NSFileManager defaultManager] fileExistsAtPath:oldManifest], "legacy source retained");
    REQUIRE([[NSFileManager defaultManager] fileExistsAtPath:manifestPath()], "legacy destination exists");

    resetFixture();
    NSString *first = RCTCreateStorageDirectoryPath_deprecated(RCTOldStorageDirectory);
    NSString *second = RCTCreateStorageDirectoryPath_deprecated(RCTExpoStorageDirectory);
    makeDir(first); makeDir(second);
    writeString(saved, [first stringByAppendingPathComponent:RCTManifestFileName]);
    writeString(saved, [second stringByAppendingPathComponent:RCTManifestFileName]);
    storage = [RNCAsyncStorage new];
    REQUIRE(failed(getItem(storage, @"language-storage")), "ambiguous legacy storage blocked");
    REQUIRE(![[NSFileManager defaultManager] fileExistsAtPath:targetDir()], "no destination created for ambiguity");
    REQUIRE([[NSFileManager defaultManager] fileExistsAtPath:[first stringByAppendingPathComponent:RCTManifestFileName]], "first legacy copy retained");
    REQUIRE([[NSFileManager defaultManager] fileExistsAtPath:[second stringByAppendingPathComponent:RCTManifestFileName]], "second legacy copy retained");
    puts("iOS native: unambiguous copy and blocked ambiguous legacy locations");
}

int main(int argc, const char **argv) {
    @autoreleasepool {
        REQUIRE(argc == 2, "temporary fixture directory required");
        TestRoot = [NSString stringWithUTF8String:argv[1]];
        REQUIRE([TestRoot.lastPathComponent hasPrefix:@"lingua-ios-storage-"], "unexpected fixture path");
        testFreshStorage();
        testInvalidManifests();
        testMissingLargeValue();
        testFailedWrites();
        testLegacyMigration();
        resetFixture();
        puts("Patched iOS storage native logic tests passed.");
    }
    return 0;
}
