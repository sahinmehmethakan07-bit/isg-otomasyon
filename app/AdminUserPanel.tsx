import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { setUserProfile } from "./lib/roleManager";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function AdminUserPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "doctor" | "nurse" | "safety_expert" | "human_resources">("doctor");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateUserClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("E-Mail ve şifre gerekli!");
    setShowAdminPassModal(true);
  };

  const executeUserCreation = async () => {
    if (!adminPassword) return alert("Admin şifrenizi girmeniz gerekiyor!");
    setLoading(true);
    const currentAdminEmail = auth.currentUser?.email;

    if (!currentAdminEmail) {
      alert("Admin oturumu bulunamadı!");
      setLoading(false);
      return;
    }

    try {
      // 1. Yeni kullanıcıyı oluştur (Bu işlem admin oturumunu düşürür)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Rolü ve profili tanımla (displayName için geçici olarak e-mail başını alıyoruz)
      await setUserProfile(uid, {
        email: email,
        displayName: email.split("@")[0], 
        role: role
      });

      // 3. Yeni kullanıcının oturumunu kapat
      await auth.signOut();

      // 4. Admin oturumunu geri yükle
      await signInWithEmailAndPassword(auth, currentAdminEmail, adminPassword);

      alert(`Kullanıcı (${role}) başarıyla oluşturuldu ve admin oturumu korundu!`);
      setEmail("");
      setPassword("");
      setAdminPassword("");
      setShowAdminPassModal(false);
    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>Yeni Kullanıcı Ekle (Admin)</h2>
      <form onSubmit={handleCreateUserClick}>
        <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: "block", marginBottom: "10px", width: "100%" }} />
        <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: "block", marginBottom: "10px", width: "100%" }} />
        <select value={role} onChange={(e) => setRole(e.target.value as any)} style={{ display: "block", marginBottom: "10px", width: "100%" }}>
          <option value="doctor">Doktor</option>
          <option value="safety_expert">İSG Uzmanı</option>
          <option value="nurse">Hemşire</option>
          <option value="human_resources">İnsan Kaynakları</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading}>Kullanıcı Oluştur</button>
      </form>

      {showAdminPassModal && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "white", padding: "20px", border: "1px solid black", zIndex: 1000, color: "black" }}>
          <h3>Güvenlik Doğrulaması</h3>
          <p>İşlemi tamamlamak için mevcut <strong>Admin şifrenizi</strong> girin:</p>
          <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} style={{ display: "block", marginBottom: "10px", width: "100%" }} />
          <button onClick={executeUserCreation} disabled={loading}>{loading ? "Oluşturuluyor..." : "Onayla ve Oluştur"}</button>
          <button onClick={() => setShowAdminPassModal(false)} style={{ marginLeft: "10px" }}>İptal</button>
        </div>
      )}
    </div>
  );
}
