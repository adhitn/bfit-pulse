import Cocoa
import WebKit

private let siteURL = URL(string: "https://bfit-pulse.atomicmacaron2.chatgpt.site/")!
private let sourceURL = URL(string: "https://recreation.ucla.edu/facilities/bfit")!

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, NSToolbarDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var failureView: NSView!
    private var failureDescription: NSTextField!
    private var backButton: NSButton?
    private var forwardButton: NSButton?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        buildMenu()
        buildWindow()
        loadHome()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        window.deminiaturize(nil)
        window.makeKeyAndOrderFront(nil)
        return true
    }

    private func buildWindow() {
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1200, height: 880),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "BFit Pulse"
        window.subtitle = "Live UCLA BFit counts"
        window.minSize = NSSize(width: 480, height: 620)
        window.isReleasedWhenClosed = false
        window.setFrameAutosaveName("BFitPulseMainWindow")
        window.center()
        window.toolbarStyle = .unified
        let toolbar = NSToolbar(identifier: "BFitPulseToolbar")
        toolbar.delegate = self
        toolbar.displayMode = .iconOnly
        toolbar.allowsUserCustomization = false
        window.toolbar = toolbar

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.translatesAutoresizingMaskIntoConstraints = false

        let root = NSView()
        root.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            webView.topAnchor.constraint(equalTo: root.topAnchor),
            webView.bottomAnchor.constraint(equalTo: root.bottomAnchor)
        ])
        window.contentView = root
        buildFailureView(in: root)
    }

    private func buildFailureView(in root: NSView) {
        let panel = NSVisualEffectView()
        panel.material = .windowBackground
        panel.blendingMode = .withinWindow
        panel.state = .active
        panel.translatesAutoresizingMaskIntoConstraints = false
        panel.isHidden = true
        root.addSubview(panel)
        NSLayoutConstraint.activate([
            panel.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            panel.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            panel.topAnchor.constraint(equalTo: root.topAnchor),
            panel.bottomAnchor.constraint(equalTo: root.bottomAnchor)
        ])
        failureView = panel

        let symbol = NSImageView()
        symbol.image = NSImage(systemSymbolName: "wifi.exclamationmark", accessibilityDescription: "Connection unavailable")
        symbol.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 42, weight: .regular)
        symbol.contentTintColor = .secondaryLabelColor
        let title = NSTextField(labelWithString: "Let’s reconnect.")
        title.font = .systemFont(ofSize: 28, weight: .semibold)
        title.alignment = .center
        failureDescription = NSTextField(wrappingLabelWithString: "BFit Pulse needs an internet connection to load the live site. Check your connection, then try again.")
        failureDescription.font = .systemFont(ofSize: 14)
        failureDescription.textColor = .secondaryLabelColor
        failureDescription.alignment = .center
        failureDescription.widthAnchor.constraint(equalToConstant: 350).isActive = true
        let retry = NSButton(title: "Try Again", target: self, action: #selector(loadHome))
        retry.bezelStyle = .rounded
        retry.keyEquivalent = "\r"
        let browser = NSButton(title: "Open Website in Browser", target: self, action: #selector(openInBrowser))
        browser.bezelStyle = .rounded
        let stack = NSStackView(views: [symbol, title, failureDescription, retry, browser])
        stack.orientation = .vertical
        stack.alignment = .centerX
        stack.spacing = 18
        stack.translatesAutoresizingMaskIntoConstraints = false
        panel.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: panel.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: panel.centerYAnchor)
        ])
    }

    private func buildMenu() {
        let bar = NSMenu()
        let appItem = NSMenuItem()
        bar.addItem(appItem)
        let appMenu = NSMenu()
        appItem.submenu = appMenu
        appMenu.addItem(withTitle: "About BFit Pulse", action: #selector(showAbout), keyEquivalent: "").target = self
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide BFit Pulse", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let hideOthers = appMenu.addItem(withTitle: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        hideOthers.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quit BFit Pulse", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")

        let viewItem = NSMenuItem(title: "View", action: nil, keyEquivalent: "")
        let viewMenu = NSMenu(title: "View")
        viewMenu.addItem(withTitle: "Live Counts", action: #selector(loadHome), keyEquivalent: "1").target = self
        viewMenu.addItem(withTitle: "Reload", action: #selector(reloadPage), keyEquivalent: "r").target = self
        viewMenu.addItem(withTitle: "Back", action: #selector(goBack), keyEquivalent: "[").target = self
        viewMenu.addItem(withTitle: "Forward", action: #selector(goForward), keyEquivalent: "]").target = self
        viewMenu.addItem(.separator())
        viewMenu.addItem(withTitle: "Zoom In", action: #selector(zoomIn), keyEquivalent: "+").target = self
        viewMenu.addItem(withTitle: "Zoom Out", action: #selector(zoomOut), keyEquivalent: "-").target = self
        viewMenu.addItem(withTitle: "Actual Size", action: #selector(resetZoom), keyEquivalent: "0").target = self
        viewMenu.addItem(.separator())
        viewMenu.addItem(withTitle: "Open Website in Browser", action: #selector(openInBrowser), keyEquivalent: "l").target = self
        viewItem.submenu = viewMenu
        bar.addItem(viewItem)

        let editItem = NSMenuItem(title: "Edit", action: nil, keyEquivalent: "")
        let editMenu = NSMenu(title: "Edit")
        for (title, selector, key) in [("Cut", "cut:", "x"), ("Copy", "copy:", "c"), ("Paste", "paste:", "v"), ("Select All", "selectAll:", "a")] {
            editMenu.addItem(withTitle: title, action: Selector(selector), keyEquivalent: key)
        }
        editItem.submenu = editMenu
        bar.addItem(editItem)

        let windowItem = NSMenuItem(title: "Window", action: nil, keyEquivalent: "")
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        windowItem.submenu = windowMenu
        bar.addItem(windowItem)
        NSApp.windowsMenu = windowMenu

        let helpItem = NSMenuItem(title: "Help", action: nil, keyEquivalent: "")
        let helpMenu = NSMenu(title: "Help")
        helpMenu.addItem(withTitle: "UCLA BFit Information", action: #selector(openSource), keyEquivalent: "").target = self
        helpItem.submenu = helpMenu
        bar.addItem(helpItem)
        NSApp.mainMenu = bar
    }

    @objc private func loadHome() {
        failureView?.isHidden = true
        window?.subtitle = "Live UCLA BFit counts"
        webView?.load(URLRequest(url: siteURL, cachePolicy: .reloadRevalidatingCacheData, timeoutInterval: 25))
    }
    @objc private func reloadPage() {
        failureView.isHidden = true
        if webView.url == nil { loadHome() } else { webView.reload() }
    }
    @objc private func goBack() { webView.goBack() }
    @objc private func goForward() { webView.goForward() }
    @objc private func zoomIn() { webView.pageZoom = min(1.8, webView.pageZoom + 0.1) }
    @objc private func zoomOut() { webView.pageZoom = max(0.7, webView.pageZoom - 0.1) }
    @objc private func resetZoom() { webView.pageZoom = 1 }
    @objc private func openInBrowser() { NSWorkspace.shared.open(siteURL) }
    @objc private func openSource() { NSWorkspace.shared.open(sourceURL) }
    @objc private func showAbout() {
        NSApp.orderFrontStandardAboutPanel(options: [
            .applicationName: "BFit Pulse",
            .applicationVersion: "1.0",
            .version: "1",
            .credits: NSAttributedString(string: "A dedicated Mac window for the live BFit Pulse website.\n\nIndependent student project. Not affiliated with UCLA or Connect2.\nAn internet connection is required for live counts.")
        ])
    }

    private func updateNavigation() {
        backButton?.isEnabled = webView.canGoBack
        forwardButton?.isEnabled = webView.canGoForward
    }
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        failureView.isHidden = true
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        failureView.isHidden = true
        updateNavigation()
    }
    private func showFailure(_ error: Error) {
        if (error as NSError).code == NSURLErrorCancelled { return }
        failureDescription.stringValue = "We couldn’t load BFit Pulse. Check your internet connection, then try again. You can also open the website in your browser."
        failureView.isHidden = false
        updateNavigation()
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { showFailure(error) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { showFailure(error) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { reloadPage() }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if navigationAction.targetFrame?.isMainFrame == false { decisionHandler(.allow); return }
        let isSite = url.scheme == "https" && url.host == siteURL.host
        let isSignIn = url.path.hasPrefix("/signin-with-chatgpt") || url.path.hasPrefix("/signout-with-chatgpt")
        if isSite && !isSignIn { decisionHandler(.allow); return }
        if ["https", "http", "mailto"].contains(url.scheme ?? "") {
            NSWorkspace.shared.open(url)
            if isSignIn { window.subtitle = "Sign-in and observations open in your browser" }
        }
        decisionHandler(.cancel)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, ["https", "http", "mailto"].contains(url.scheme ?? "") {
            NSWorkspace.shared.open(url)
        }
        return nil
    }

    func toolbarAllowedItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] { toolbarDefaultItemIdentifiers(toolbar) }
    func toolbarDefaultItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        [NSToolbarItem.Identifier("back"), NSToolbarItem.Identifier("forward"), NSToolbarItem.Identifier("reload"), .flexibleSpace, NSToolbarItem.Identifier("browser")]
    }
    func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier identifier: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
        let values: [String: (String, String, Selector)] = [
            "back": ("Back", "chevron.left", #selector(goBack)),
            "forward": ("Forward", "chevron.right", #selector(goForward)),
            "reload": ("Reload", "arrow.clockwise", #selector(reloadPage)),
            "browser": ("Open in Browser", "safari", #selector(openInBrowser))
        ]
        guard let (label, symbol, action) = values[identifier.rawValue] else { return nil }
        let item = NSToolbarItem(itemIdentifier: identifier)
        item.label = label
        item.paletteLabel = label
        item.toolTip = label
        let button = NSButton(image: NSImage(systemSymbolName: symbol, accessibilityDescription: label)!, target: self, action: action)
        button.bezelStyle = .texturedRounded
        button.setAccessibilityLabel(label)
        item.view = button
        if identifier.rawValue == "back" { backButton = button; button.isEnabled = false }
        if identifier.rawValue == "forward" { forwardButton = button; button.isEnabled = false }
        return item
    }
}

let application = NSApplication.shared
let delegate = AppDelegate()
application.delegate = delegate
application.run()
