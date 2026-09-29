type ImageAsset = import("react-native").ImageSourcePropType;

declare module "*.png" {
  const value: ImageAsset;
  export default value;
}

declare module "*.jpg" {
  const value: ImageAsset;
  export default value;
}

declare module "*.jpeg" {
  const value: ImageAsset;
  export default value;
}

declare module "*.gif" {
  const value: ImageAsset;
  export default value;
}

declare module "*.webp" {
  const value: ImageAsset;
  export default value;
}
