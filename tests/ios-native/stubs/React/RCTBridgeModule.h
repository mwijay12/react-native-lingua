#import <Foundation/Foundation.h>

typedef void (^RCTResponseSenderBlock)(NSArray *response);
@protocol RCTBridgeModule <NSObject>
@end
#define RCT_EXPORT_MODULE(...)
#define RCT_EXPORT_METHOD(method) - (void)method
