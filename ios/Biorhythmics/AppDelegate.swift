//
//  AppDelegate.swift
//  Biorhythmics
//
//  Created by Elvis Pfutzenreuter on 10/31/16.
//  Copyright © 2016 Elvis Pfutzenreuter. All rights reserved.
//

import UIKit
import JavaScriptCore
import UserNotifications
import UserNotificationsUI


@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var js: JSContext?


    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        
        let jsmain = Bundle.main.path(forResource: "main", ofType: "js")
        var jsscript = ""
        do {
            jsscript = try String(contentsOfFile: jsmain!, encoding: String.Encoding.utf8)
        } catch (_) {
            NSLog("Could not read main.js")
        }
        
        js = JSContext()
        
        js?.exceptionHandler = { context, exception in
            NSLog("JS Error: \(exception)")
        }
        
        _ = js?.evaluateScript("var console = { log: function(message) { _consoleLog(message) } }")
        let consoleLog: @convention(block) (String) -> Void = { message in
            NSLog("console.log: %@", message)
        }
        js?.setObject(unsafeBitCast(consoleLog, to: AnyObject.self),
                      forKeyedSubscript: "_consoleLog" as (NSCopying & NSObjectProtocol)!)
        
        js!.evaluateScript(jsscript)
        if js!.objectForKeyedSubscript("determine_bio") == nil {
            NSLog("Function not found in main.js")
            js = nil
        }
        
        UIApplication.shared.setMinimumBackgroundFetchInterval(3600.0)
        
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options:[.badge, .alert, .sound]) { (granted, error) in
            // Enable or disable features based on authorization.
        }
        return true
    }
    
    func application(_ application: UIApplication,
                     performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void)
    {
        NSLog("background execution")
        if determine_bio() {
            completionHandler(.newData)
        } else {
            completionHandler(.noData)
        }
    }
    
    func determine_bio() -> Bool
    {
        var ret = false;
        
        if js != nil {
            let prefs = UserDefaults.standard
            let data = prefs.string(forKey: "prefs")!
            let jsf = js!.objectForKeyedSubscript("determine_bio")
            let msgs = jsf!.call(withArguments: [data])
            if let amsgs = msgs!.toArray() as? [String] {
                if amsgs.count > 0 {
                    if amsgs[0].characters.count > 0 {
                        NSLog("Warning: %@", amsgs[0])
                    } else {
                        ret = true;
                        
                        let content = UNMutableNotificationContent()
                        
                        content.title = "Biorhythmics"
                        content.body = amsgs[1]
                        content.sound = UNNotificationSound.default()
                        let trigger = UNTimeIntervalNotificationTrigger.init(timeInterval: 5, repeats: false)
                        let request = UNNotificationRequest.init(identifier: "txt",
                                                                 content: content,
                                                                 trigger: trigger)
                        
                        let center = UNUserNotificationCenter.current()
                        center.add(request){ (error : Error?) in
                        }
                        
                        if amsgs.count > 2 {
                            let content = UNMutableNotificationContent()
                            content.title = "Biorhythmics"
                            content.body = amsgs[2]
                            content.sound = UNNotificationSound.default()
                            let trigger = UNTimeIntervalNotificationTrigger.init(timeInterval: 10, repeats: false)
                            let request = UNNotificationRequest.init(identifier: "txt2",
                                                                     content: content,
                                                                     trigger: trigger)
                            
                            let center = UNUserNotificationCenter.current()
                            center.add(request){ (error : Error?) in
                            }
                        }
                    }
                }
            }
        }
        
        return ret;
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    
}

