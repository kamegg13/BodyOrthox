// GoogleMlKitSimulatorStubs.m
//
// Stub simulator pour google_mlkit_pose_detection.
// Sur simulateur iOS, ML Kit n'a pas de slice arm64-iphonesimulator.
// Ce fichier fournit une implémentation vide du channel sur simulateur
// pendant que les vrais fichiers du pod sont exclus via EXCLUDED_SOURCE_FILE_NAMES.
//
// Sur device, TARGET_OS_SIMULATOR est false → ce bloc est ignoré par le compilateur.

#if TARGET_OS_SIMULATOR

#import <Flutter/Flutter.h>

// Déclaration de l'interface attendue par GeneratedPluginRegistrant.
@interface GoogleMlKitPoseDetectionPlugin : NSObject<FlutterPlugin>
@end

@implementation GoogleMlKitPoseDetectionPlugin

+ (void)registerWithRegistrar:(NSObject<FlutterPluginRegistrar>*)registrar {
    FlutterMethodChannel* channel = [FlutterMethodChannel
                                     methodChannelWithName:@"google_mlkit_pose_detector"
                                     binaryMessenger:[registrar messenger]];
    GoogleMlKitPoseDetectionPlugin* instance = [[GoogleMlKitPoseDetectionPlugin alloc] init];
    [registrar addMethodCallDelegate:instance channel:channel];
}

- (void)handleMethodCall:(FlutterMethodCall*)call result:(FlutterResult)result {
    if ([call.method isEqualToString:@"vision#startPoseDetector"]) {
        // Simulateur : retourne un tableau vide de poses (ML Kit non disponible)
        result(@[]);
    } else if ([call.method isEqualToString:@"vision#closePoseDetector"]) {
        result(nil);
    } else {
        result(FlutterMethodNotImplemented);
    }
}

@end

#endif // TARGET_OS_SIMULATOR
