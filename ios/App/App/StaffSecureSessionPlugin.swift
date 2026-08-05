import Capacitor
import Foundation
import LocalAuthentication
import Security

@objc(StaffSecureSessionPlugin)
public class StaffSecureSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StaffSecureSessionPlugin"
    public let jsName = "StaffSecureSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "has", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    private let service = "com.doublecorgi.unicolle.staff-session"
    private let account = "staff-supabase-session"

    @objc func get(_ call: CAPPluginCall) {
        var query: [String: Any] = baseQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound {
            call.resolve(["value": NSNull()])
            return
        }
        guard status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) else {
            call.reject("secure_storage_unavailable")
            return
        }
        call.resolve(["value": value])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let value = call.getString("value"), let data = value.data(using: .utf8) else {
            call.reject("invalid_value")
            return
        }

        SecItemDelete(baseQuery() as CFDictionary)
        var query: [String: Any] = baseQuery()
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            call.reject("secure_storage_write_failed")
            return
        }
        call.resolve()
    }

    @objc func remove(_ call: CAPPluginCall) {
        let status = SecItemDelete(baseQuery() as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            call.reject("secure_storage_remove_failed")
            return
        }
        call.resolve()
    }

    @objc func has(_ call: CAPPluginCall) {
        var query: [String: Any] = baseQuery()
        query[kSecReturnData as String] = false
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        let status = SecItemCopyMatching(query as CFDictionary, nil)
        if status == errSecSuccess {
            call.resolve(["value": true])
            return
        }
        if status == errSecItemNotFound {
            call.resolve(["value": false])
            return
        }
        call.reject("secure_storage_unavailable")
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        context.localizedCancelTitle = "キャンセル"
        let reason = call.getString("reason") ?? "運営管理機能を開くために本人確認を行います。"
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            call.reject("device_auth_unavailable")
            return
        }

        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, _ in
            DispatchQueue.main.async {
                if success {
                    call.resolve()
                } else {
                    call.reject("device_auth_failed")
                }
            }
        }
    }


    private func baseQuery() -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }
}
