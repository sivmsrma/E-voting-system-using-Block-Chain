import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import VotingAbi from "./Voting.json";
import AdminDashboard from "./pages/AdminDashboard";
import VotingPage from "./pages/VotingPage";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'user'

  useEffect(() => {
    // Load saved role from localStorage
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }
    checkWalletConnection();
  }, []);

  useEffect(() => {
    // Save role to localStorage whenever it changes
    if (userRole) {
      localStorage.setItem('userRole', userRole);
      // Navigate to appropriate page
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/vote');
      }
    } else {
      localStorage.removeItem('userRole');
      if (location.pathname !== '/') {
        navigate('/');
      }
    }
  }, [userRole]);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          connectWallet();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const votingContract = new ethers.Contract(CONTRACT_ADDRESS, VotingAbi.abi, signer);
        setContract(votingContract);

        const owner = await votingContract.owner();
        if (owner.toLowerCase() === address.toLowerCase()) {
          setIsAdmin(true);
        }

        showNotification("Wallet connected successfully!", "success");
      } catch (err) {
        console.error("Connection Failed", err);
        showNotification("Failed to connect wallet", "error");
      }
    } else {
      showNotification("Please install MetaMask!", "error");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setIsAdmin(false);
    setUserRole(null);
    localStorage.removeItem('userRole');
    navigate('/');
    showNotification("Wallet disconnected", "info");
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('userRole');
    navigate('/');
    showNotification("Logged out successfully", "info");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    if (username === 'admin' && password === 'admin') {
      if (!isAdmin) {
        showNotification("You are not the admin account!", "error");
        return;
      }
      setUserRole('admin');
      showNotification("Admin login successful!", "success");
    } else if (username === 'user' && password === 'user') {
      setUserRole('user');
      showNotification("User login successful!", "success");
    } else {
      showNotification("Invalid username or password!", "error");
    }
  };

  return (
    <View style={styles.container}>
      {/* Notification Toast */}
      {notification && (
        <View style={[styles.notification, styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🗳️</Text>
          <View>
            <Text style={styles.title}>Blockchain Voting</Text>
            <Text style={styles.subtitle}>Decentralized & Transparent</Text>
          </View>
        </View>

        {account && (
          <View style={styles.walletInfo}>
            <View style={styles.accountBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.address}>{account.slice(0, 6)}...{account.slice(-4)}</Text>
              {isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
            </View>
            {userRole && (
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.disconnectButton} onPress={disconnectWallet}>
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <Routes>
        <Route
          path="/"
          element={
            !account ? (
              <View style={styles.welcomeScreen}>
                <Text style={styles.welcomeIcon}>🗳️</Text>
                <Text style={styles.welcomeTitle}>Welcome to Blockchain Voting</Text>
                <Text style={styles.welcomeSubtitle}>Connect your wallet to participate in elections</Text>
                <TouchableOpacity style={styles.connectButtonLarge} onPress={connectWallet}>
                  <Text style={styles.buttonTextLarge}>Connect Wallet</Text>
                </TouchableOpacity>
              </View>
            ) : !userRole ? (
              <View style={styles.loginScreen}>
                <View style={styles.loginCard}>
                  <Text style={styles.loginIcon}>🔐</Text>
                  <Text style={styles.loginTitle}>Login</Text>
                  <Text style={styles.loginSubtitle}>Enter your credentials to continue</Text>

                  <form onSubmit={handleLogin} style={styles.loginForm}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Username</Text>
                      <input
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        style={styles.loginInput}
                        required
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        style={styles.loginInput}
                        required
                      />
                    </View>

                    <button type="submit" style={styles.loginButton}>
                      Login
                    </button>
                  </form>

                  <View style={styles.credentialsHint}>
                    <Text style={styles.hintTitle}>💡 Demo Credentials:</Text>
                    <Text style={styles.hintText}>Admin: admin / admin</Text>
                    <Text style={styles.hintText}>User: user / user</Text>
                  </View>
                </View>
              </View>
            ) : null
          }
        />
        <Route
          path="/admin"
          element={
            userRole === 'admin' ? (
              <AdminDashboard
                contract={contract}
                showNotification={showNotification}
              />
            ) : (
              <View style={styles.welcomeScreen}>
                <Text style={styles.welcomeIcon}>🚫</Text>
                <Text style={styles.welcomeTitle}>Access Denied</Text>
                <Text style={styles.welcomeSubtitle}>You need admin privileges to access this page</Text>
                <TouchableOpacity style={styles.connectButtonLarge} onPress={() => navigate('/')}>
                  <Text style={styles.buttonTextLarge}>Go to Login</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
        <Route
          path="/vote"
          element={
            userRole === 'user' ? (
              <VotingPage
                contract={contract}
                account={account}
                showNotification={showNotification}
              />
            ) : (
              <View style={styles.welcomeScreen}>
                <Text style={styles.welcomeIcon}>🚫</Text>
                <Text style={styles.welcomeTitle}>Access Denied</Text>
                <Text style={styles.welcomeSubtitle}>Please login as a user to access voting</Text>
                <TouchableOpacity style={styles.connectButtonLarge} onPress={() => navigate('/')}>
                  <Text style={styles.buttonTextLarge}>Go to Login</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      </Routes>
    </View>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    height: "100%",
  },
  notification: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  notificationSuccess: {
    backgroundColor: "#10b981",
  },
  notificationError: {
    backgroundColor: "#ef4444",
  },
  notificationInfo: {
    backgroundColor: "#6366f1",
  },
  notificationText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2d2d44",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
  },
  walletInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1a1a2e",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  address: {
    color: "#10b981",
    fontWeight: "600",
    fontSize: 14,
  },
  adminBadge: {
    backgroundColor: "#8b5cf6",
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disconnectButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  welcomeScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  welcomeIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 32,
    textAlign: "center",
  },
  connectButtonLarge: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonTextLarge: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
  loginScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loginCard: {
    backgroundColor: "#1a1a2e",
    padding: 40,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2d2d44",
  },
  loginIcon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 32,
    textAlign: "center",
  },
  loginForm: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  loginInput: {
    width: "100%",
    backgroundColor: "#0f0f23",
    color: "#fff",
    padding: 14,
    borderRadius: 8,
    border: "1px solid #2d2d44",
    fontSize: 16,
    outline: "none",
    fontFamily: "inherit",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#6366f1",
    color: "#fff",
    padding: 14,
    borderRadius: 8,
    border: "none",
    fontSize: 16,
    fontWeight: "600",
    cursor: "pointer",
    marginTop: 8,
  },
  credentialsHint: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#0f0f23",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2d2d44",
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
});
