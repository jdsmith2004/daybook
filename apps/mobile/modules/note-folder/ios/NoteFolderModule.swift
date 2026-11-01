// One folder the person picked, kept across launches with a security-scoped bookmark (expo-file-system can pick a folder on
// iOS, but its access ends with the launch). Every file call is coordinated, because the folder is usually in iCloud Drive,
// where a file can be away or being synced. It only ever takes a plain file name ending in .md, so it cannot reach out of
// the folder, into a subfolder, or at any other kind of file. The rules for what to write are in core journal-notes.ts.
import ExpoModulesCore
import UIKit
import UniformTypeIdentifiers

private let bookmarkKey = "daybook.noteFolder.bookmark"
/// how long one file may take before it counts as out of reach (iCloud may be bringing it down, or there may be no network)
private let fileTimeout: DispatchTimeInterval = .seconds(20)

internal final class FolderUnreachable: Exception, @unchecked Sendable {
  override var reason: String { "The folder could not be reached." }
}
internal final class BadFileName: Exception, @unchecked Sendable {
  override var reason: String { "That is not a note's file name." }
}

public final class NoteFolderModule: Module {
  private let files = DispatchQueue(label: "daybook.note-folder", qos: .utility)
  private var picking: Promise?
  private var pickerDelegate: PickerDelegate?

  public func definition() -> ModuleDefinition {
    Name("NoteFolder")

    /// shows the folder picker; gives the folder's name, or null when it was closed
    AsyncFunction("pick") { (promise: Promise) in
      guard self.picking == nil, let top = self.topController() else {
        promise.resolve(nil)
        return
      }
      self.picking = promise
      let delegate = PickerDelegate { url in self.didPick(url) }
      self.pickerDelegate = delegate
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.folder], asCopy: false)
      picker.delegate = delegate
      picker.presentationController?.delegate = delegate
      top.present(picker, animated: true)
    }.runOnQueue(.main)

    /// the kept folder's name, or null when none is kept or it is gone
    AsyncFunction("folder") { () -> String? in
      return try? self.withFolder { FileManager.default.fileExists(atPath: $0.path) ? $0.lastPathComponent : nil }
    }.runOnQueue(files)

    AsyncFunction("forget") { () in
      UserDefaults.standard.removeObject(forKey: bookmarkKey)
    }.runOnQueue(files)

    /// a file's text, or null when it is not there
    AsyncFunction("read") { (name: String) -> String? in
      let file = try self.checked(name)
      return try self.withFolder { folder in
        let url = folder.appendingPathComponent(file)
        return try self.coordinated(reading: url) { u in
          guard FileManager.default.fileExists(atPath: u.path) else { return nil }
          return try String(contentsOf: u, encoding: .utf8)
        }
      }
    }.runOnQueue(files)

    AsyncFunction("write") { (name: String, text: String) in
      let file = try self.checked(name)
      try self.withFolder { folder in
        let url = folder.appendingPathComponent(file)
        try self.coordinated(writing: url, options: .forReplacing) { u in
          try text.write(to: u, atomically: true, encoding: .utf8)
        }
      }
    }.runOnQueue(files)

    AsyncFunction("remove") { (name: String) in
      let file = try self.checked(name)
      try self.withFolder { folder in
        let url = folder.appendingPathComponent(file)
        try self.coordinated(writing: url, options: .forDeleting) { u in
          if FileManager.default.fileExists(atPath: u.path) {
            try FileManager.default.removeItem(at: u)
          }
        }
      }
    }.runOnQueue(files)

    AsyncFunction("move") { (from: String, to: String) in
      let a = try self.checked(from)
      let b = try self.checked(to)
      try self.withFolder { folder in
        try self.coordinatedMove(from: folder.appendingPathComponent(a), to: folder.appendingPathComponent(b))
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
    /// the picker's URL is scoped: the bookmark has to be made while its access is open
    let opened = url.startAccessingSecurityScopedResource()
    defer { if opened { url.stopAccessingSecurityScopedResource() } }
    do {
      let data = try url.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil)
      UserDefaults.standard.set(data, forKey: bookmarkKey)
      promise?.resolve(url.lastPathComponent)
    } catch {
      promise?.reject(FolderUnreachable())
    }
  }

  private func topController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    var top = scene?.windows.first { $0.isKeyWindow }?.rootViewController ?? scene?.windows.first?.rootViewController
    while let next = top?.presentedViewController { top = next }
    return top
  }

  // MARK: the folder

  private func checked(_ name: String) throws -> String {
    let plain = !name.isEmpty && !name.contains("/") && !name.contains("\\") && !name.hasPrefix(".") && !name.contains("\0")
    guard plain, name.hasSuffix(".md") else { throw BadFileName() }
    return name
  }

  /// opens the kept folder for one piece of work
  private func withFolder<T>(_ work: (URL) throws -> T) throws -> T {
    guard let data = UserDefaults.standard.data(forKey: bookmarkKey) else { throw FolderUnreachable() }
    var stale = false
    let folder: URL
    do {
      folder = try URL(resolvingBookmarkData: data, options: [], relativeTo: nil, bookmarkDataIsStale: &stale)
    } catch {
      throw FolderUnreachable()
    }
    guard folder.startAccessingSecurityScopedResource() else { throw FolderUnreachable() }
    defer { folder.stopAccessingSecurityScopedResource() }
    /// a folder moved or renamed gives a stale bookmark that still works: it is made again while access is open
    if stale, let fresh = try? folder.bookmarkData(options: [], includingResourceValuesForKeys: nil, relativeTo: nil) {
      UserDefaults.standard.set(fresh, forKey: bookmarkKey)
    }
    return try work(folder)
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

  private func coordinatedMove(from src: URL, to dst: URL) throws {
    let coordinator = NSFileCoordinator(filePresenter: nil)
    var outside: NSError?
    var result: Result<Void, Error>?
    timed(coordinator) {
      coordinator.coordinate(writingItemAt: src, options: .forMoving, writingItemAt: dst, options: .forReplacing, error: &outside) { a, b in
        result = Result { try FileManager.default.moveItem(at: a, to: b) }
      }
    }
    try finish(outside, result)
  }

  /// gives up on a coordinated call if iCloud holds it too long
  private func timed(_ coordinator: NSFileCoordinator, _ call: () -> Void) {
    let timer = DispatchWorkItem { coordinator.cancel() }
    DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + fileTimeout, execute: timer)
    call()
    timer.cancel()
  }

  @discardableResult
  private func finish<T>(_ outside: NSError?, _ result: Result<T, Error>?) throws -> T {
    guard outside == nil, let result else { throw FolderUnreachable() }
    return try result.get()
  }
}

private final class PickerDelegate: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  private let done: (URL?) -> Void
  init(done: @escaping (URL?) -> Void) { self.done = done }
  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) { done(urls.first) }
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { done(nil) }
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { done(nil) }
}
