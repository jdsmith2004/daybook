// The scripture library's way into the person's Obsidian vault (the rules are in core scripture.ts). One folder, the vault, kept
// across launches with a security-scoped bookmark, the way modules/note-folder keeps the journal's folder. It reads only inside
// Scriptures/ and the audio plugin's timings file, and writes only a notes file directly in Scriptures/Notes, and only when that
// file is still what the app last read (swap): the compare and the write happen inside one coordinated write, so a change that
// Obsidian or iCloud made in between is never written over. A file iCloud keeps away counts as out of reach, never as missing,
// so a note that has not come down yet is never replaced by a new file.
import ExpoModulesCore
import UIKit
import UniformTypeIdentifiers

private let bookmarkKey = "daybook.scriptureVault.bookmark"
private let root = "Scriptures"
private let notesDir = "Notes"
private let timingsPath = ".obsidian/plugins/scripture-audio/timings.json"
/// how long one file may take before it counts as out of reach (iCloud may be bringing it down, or there may be no network)
private let fileTimeout: DispatchTimeInterval = .seconds(20)

internal final class VaultUnreachable: Exception, @unchecked Sendable {
  override var reason: String { "The vault could not be reached." }
}
internal final class BadPath: Exception, @unchecked Sendable {
  override var reason: String { "That is not a path in the scripture library." }
}

public final class ScriptureVaultModule: Module {
  private let files = DispatchQueue(label: "daybook.scripture-vault", qos: .userInitiated)
  private var picking: Promise?
  private var pickerDelegate: VaultPickerDelegate?

  public func definition() -> ModuleDefinition {
    Name("ScriptureVault")

    /// shows the folder picker; the vault's name and whether it holds the library, or null when it was closed
    AsyncFunction("pick") { (promise: Promise) in
      guard self.picking == nil, let top = self.topController() else {
        promise.resolve(nil)
        return
      }
      self.picking = promise
      let delegate = VaultPickerDelegate { url in self.didPick(url) }
      self.pickerDelegate = delegate
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.folder], asCopy: false)
      picker.delegate = delegate
      picker.presentationController?.delegate = delegate
      top.present(picker, animated: true)
    }.runOnQueue(.main)

    AsyncFunction("folder") { () -> String? in
      return try? self.withVault { FileManager.default.fileExists(atPath: $0.appendingPathComponent(root).path) ? $0.lastPathComponent : nil }
    }.runOnQueue(files)

    AsyncFunction("forget") { () in
      UserDefaults.standard.removeObject(forKey: bookmarkKey)
    }.runOnQueue(files)

    /// what is directly in a folder of the library. A file iCloud keeps away is listed by its real name, and asked for
    AsyncFunction("list") { (dir: String) -> [[String: Any]] in
      let rel = try self.checked(dir, kind: .folder)
      return try self.withVault { vault in
        let url = try self.inside(vault, rel)
        return try self.coordinated(reading: url) { u in
          let items = try FileManager.default.contentsOfDirectory(at: u, includingPropertiesForKeys: [.isDirectoryKey], options: [])
          var out: [[String: Any]] = []
          for item in items {
            var name = item.lastPathComponent
            if name.hasPrefix("."), name.hasSuffix(".icloud") {
              name = String(name.dropFirst().dropLast(".icloud".count))
              try? FileManager.default.startDownloadingUbiquitousItem(at: item)
              out.append(["name": name, "dir": false])
              continue
            }
            if name.hasPrefix(".") { continue }
            let isDir = (try? item.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
            out.append(["name": name, "dir": isDir == true])
          }
          return out
        }
      }
    }.runOnQueue(files)

    /// a file's text, or null when it is not there
    AsyncFunction("read") { (path: String) -> String? in
      let rel = try self.checked(path, kind: .read)
      return try self.withVault { vault in
        let url = try self.inside(vault, rel)
        return try self.coordinated(reading: url) { u in
          if FileManager.default.fileExists(atPath: u.path) {
            return String(decoding: try Data(contentsOf: u), as: UTF8.self)
          }
          if self.isAway(u) { throw VaultUnreachable() }
          return nil
        }
      }
    }.runOnQueue(files)

    /// writes a notes file only when it is still `expected` (nil: it is not there yet); false when it changed
    AsyncFunction("swap") { (path: String, expected: String?, text: String) -> Bool in
      let rel = try self.checked(path, kind: .write)
      return try self.withVault { vault in
        let url = try self.inside(vault, rel)
        /// a notes file still in iCloud is brought down first, so it is compared, never taken for missing
        if self.isAway(url) {
          _ = try? self.coordinated(reading: url) { _ in true }
        }
        return try self.coordinated(writing: url, options: []) { u in
          let fm = FileManager.default
          let cur: String?
          if fm.fileExists(atPath: u.path) {
            cur = String(decoding: try Data(contentsOf: u), as: UTF8.self)
          } else {
            if self.isAway(u) { throw VaultUnreachable() }
            cur = nil
          }
          guard cur == expected else { return false }
          let dir = u.deletingLastPathComponent()
          if !fm.fileExists(atPath: dir.path) { try fm.createDirectory(at: dir, withIntermediateDirectories: false) }
          try text.write(to: u, atomically: true, encoding: .utf8)
          return true
        }
      }
    }.runOnQueue(files)
  }

  // MARK: picking

  private func didPick(_ url: URL?) {
    let promise = picking
    picking = nil
    pickerDelegate = nil
    guard let url else {
      promise?.resolve(nil)
      return
    }
    let opened = url.startAccessingSecurityScopedResource()
    defer { if opened { url.stopAccessingSecurityScopedResource() } }
    var isDir: ObjCBool = false
    let has = FileManager.default.fileExists(atPath: url.appendingPathComponent(root).path, isDirectory: &isDir) && isDir.boolValue
    guard has else {
      promise?.resolve(["name": url.lastPathComponent, "ok": false])
      return
    }
    do {
      let data = try url.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil)
      UserDefaults.standard.set(data, forKey: bookmarkKey)
      promise?.resolve(["name": url.lastPathComponent, "ok": true])
    } catch {
      promise?.reject(VaultUnreachable())
    }
  }

  private func topController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    var top = scene?.windows.first { $0.isKeyWindow }?.rootViewController ?? scene?.windows.first?.rootViewController
    while let next = top?.presentedViewController { top = next }
    return top
  }

  // MARK: the vault

  private enum Kind { case folder, read, write }

  /// a path inside the library: every part plain, none hidden, nothing that climbs out. Reads take Markdown in the library
  /// and the one timings file; a write takes only a Markdown file directly in Scriptures/Notes
  private func checked(_ path: String, kind: Kind) throws -> String {
    if kind == .read, path == timingsPath { return path }
    let parts = path.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
    guard let first = parts.first, first == root else { throw BadPath() }
    for p in parts {
      guard !p.isEmpty, !p.hasPrefix("."), !p.contains("\\"), !p.contains("\0") else { throw BadPath() }
    }
    switch kind {
    case .folder:
      return path
    case .read:
      guard parts.count >= 2, path.hasSuffix(".md") else { throw BadPath() }
    case .write:
      guard parts.count == 3, parts[1] == notesDir, path.hasSuffix(".md") else { throw BadPath() }
    }
    return path
  }

  /// the file's URL, checked once more to be inside the vault
  private func inside(_ vault: URL, _ rel: String) throws -> URL {
    let url = vault.appendingPathComponent(rel).standardizedFileURL
    let base = vault.standardizedFileURL.path
    guard url.path.hasPrefix(base.hasSuffix("/") ? base : base + "/") else { throw BadPath() }
    return url
  }

  /// iCloud keeps this file away: only its stand-in is here
  private func isAway(_ url: URL) -> Bool {
    let stand = url.deletingLastPathComponent().appendingPathComponent("." + url.lastPathComponent + ".icloud")
    if FileManager.default.fileExists(atPath: stand.path) {
      try? FileManager.default.startDownloadingUbiquitousItem(at: url)
      return true
    }
    return false
  }

  private func withVault<T>(_ work: (URL) throws -> T) throws -> T {
    guard let data = UserDefaults.standard.data(forKey: bookmarkKey) else { throw VaultUnreachable() }
    var stale = false
    let vault: URL
    do {
      vault = try URL(resolvingBookmarkData: data, options: [], relativeTo: nil, bookmarkDataIsStale: &stale)
    } catch {
      throw VaultUnreachable()
    }
    guard vault.startAccessingSecurityScopedResource() else { throw VaultUnreachable() }
    defer { vault.stopAccessingSecurityScopedResource() }
    if stale, let fresh = try? vault.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil) {
      UserDefaults.standard.set(fresh, forKey: bookmarkKey)
    }
    return try work(vault)
  }

  private func coordinated<T>(reading url: URL, _ work: (URL) throws -> T) throws -> T {
    let coordinator = NSFileCoordinator(filePresenter: nil)
    var outside: NSError?
    var result: Result<T, Error>?
    timed(coordinator) {
      coordinator.coordinate(readingItemAt: url, options: [], error: &outside) { u in
        result = Result { try work(u) }
      }
    }
    return try finish(outside, result)
  }

  private func coordinated<T>(writing url: URL, options: NSFileCoordinator.WritingOptions, _ work: (URL) throws -> T) throws -> T {
    let coordinator = NSFileCoordinator(filePresenter: nil)
    var outside: NSError?
    var result: Result<T, Error>?
    timed(coordinator) {
      coordinator.coordinate(writingItemAt: url, options: options, error: &outside) { u in
        result = Result { try work(u) }
      }
    }
    return try finish(outside, result)
  }

  /// gives up on a coordinated call if iCloud holds it too long
  private func timed(_ coordinator: NSFileCoordinator, _ call: () -> Void) {
    let timer = DispatchWorkItem { coordinator.cancel() }
    DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + fileTimeout, execute: timer)
    call()
    timer.cancel()
  }

  private func finish<T>(_ outside: NSError?, _ result: Result<T, Error>?) throws -> T {
    guard outside == nil, let result else { throw VaultUnreachable() }
    return try result.get()
  }
}

private final class VaultPickerDelegate: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  private let done: (URL?) -> Void
  init(done: @escaping (URL?) -> Void) { self.done = done }
  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) { done(urls.first) }
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { done(nil) }
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { done(nil) }
}
