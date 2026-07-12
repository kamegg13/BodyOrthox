#import <Foundation/Foundation.h>
#import <BodyOrthoxSpec/BodyOrthoxSpec.h>

NS_ASSUME_NONNULL_BEGIN

/// Glue Obj-C++ du TurboModule "PoseLandmarker" : conforme au protocole
/// généré par codegen (BodyOrthoxSpec), délègue à PoseLandmarkerImpl (Swift).
@interface RCTPoseLandmarker : NSObject <NativePoseLandmarkerSpec>
@end

NS_ASSUME_NONNULL_END
