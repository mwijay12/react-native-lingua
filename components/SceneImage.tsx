import { useState } from "react";
import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";

interface SceneImageProps {
  source: ImageSourcePropType;
  aspectRatio: number;
  maxHeight: number;
  className?: string;
  testID?: string;
}

// Bundled React Native Images inherit their asset's original width and height.
// Giving the frame an explicit measured height and the image two percentage
// dimensions prevents those intrinsic sizes from inflating the parent in Yoga.
export function SceneImage({ source, aspectRatio, maxHeight, className = "", testID }: SceneImageProps) {
  const [width, setWidth] = useState(0);
  const height = width > 0 ? Math.min(width / aspectRatio, maxHeight) : maxHeight;

  return (
    <View
      className={`w-full overflow-hidden ${className}`}
      style={{ height }}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0) setWidth((previous) => previous === nextWidth ? previous : nextWidth);
      }}
      testID={testID}
    >
      <Image source={source} style={styles.image} resizeMode="cover" accessible={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: "100%" },
});
