#import <Foundation/Foundation.h>
#import <TargetConditionals.h>
#if !TARGET_OS_OSX
#import <UIKit/UIKit.h>
#endif
#define RCTNullIfNil(value) ((value) ?: (id)kCFNull)
NSDictionary *RCTMakeError(NSString *message, id detail, NSDictionary *extra);
NSDictionary *RCTMakeAndLogError(NSString *message, id detail, NSDictionary *extra);
NSDictionary *RCTJSErrorFromNSError(NSError *error);
NSString *RCTMD5Hash(NSString *value);
id RCTJSONParse(NSString *json, NSError **error);
id RCTJSONParseMutable(NSString *json, NSError **error);
NSString *RCTJSONStringify(id value, NSError **error);
