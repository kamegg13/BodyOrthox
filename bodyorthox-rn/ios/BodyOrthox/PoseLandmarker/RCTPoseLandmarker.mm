#import "RCTPoseLandmarker.h"
// Déclare RCTDefaultReactNativeFactoryDelegate (superclasse ObjC de
// ReactNativeDelegate côté AppDelegate.swift) avant le header Swift généré,
// sans quoi BodyOrthox-Swift.h ne compile pas dans ce .mm.
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#import "BodyOrthox-Swift.h"

@implementation RCTPoseLandmarker {
  PoseLandmarkerImpl *_impl;
}

RCT_EXPORT_MODULE(PoseLandmarker)

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [PoseLandmarkerImpl new];
  }
  return self;
}

- (void)detectFromImage:(NSString *)imageBase64
                options:(JS::NativePoseLandmarker::DetectFromImageOptions &)options
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [_impl detectFromImage:imageBase64
                   modelAsset:options.modelAsset()
                     delegate:options.delegate()
   minPoseDetectionConfidence:options.minPoseDetectionConfidence()
   minPosePresenceConfidence:options.minPosePresenceConfidence()
                      resolve:^(NSDictionary<NSString *, id> *result) {
                        resolve(result);
                      }
                       reject:^(NSString *code, NSString *message, NSError *_Nullable error) {
                         reject(code, message, error);
                       }];
}

- (void)dispose
{
  [_impl dispose];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePoseLandmarkerSpecJSI>(params);
}

@end
