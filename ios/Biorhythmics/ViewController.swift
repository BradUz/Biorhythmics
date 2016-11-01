//
//  ViewController.swift
//  Biorhythmics
//
//  Created by Elvis Pfutzenreuter on 10/31/16.
//  Copyright © 2016 Elvis Pfutzenreuter. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
    @IBOutlet weak var html: UIWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        html.scrollView.isScrollEnabled = false;
        html.scrollView.bounces = false;
        html.scalesPageToFit = true;
        html.dataDetectorTypes = UIDataDetectorTypes(rawValue: 0);
        let f = Bundle.main.path(forResource: "index", ofType: "html")
        let url = URL(fileURLWithPath: f!)
        html.loadRequest(URLRequest.init(url: url))
        
        let prefs = UserDefaults.standard
        prefs.register(defaults: ["prefs" : ""])
    }
    
    func webView(_ webView: UIWebView,
                 shouldStartLoadWithRequest request: NSURLRequest,
                 navigationType:UIWebViewNavigationType) -> Bool {
        let data = request.url?.absoluteString
        // NSLog("Received load request")
        if data?.range(of: "blist:") != nil {
            NSLog("Received app data %@", data!)
            let cdata = data?.substring(
                from: (data?.index((data?.startIndex)!, offsetBy: 6))!)
            let prefs = UserDefaults.standard
            prefs.set(cdata, forKey: "prefs")
            
            return false;
        }
        return true;
    }
}

