import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import AdminDashboard from './pages/AdminDashboard';
import VotingPage from './pages/VotingPage';
import { useContract } from './hooks/useContract';
import { UserRole, NotificationType } from './types';
import { DEMO_CREDENTIALS } from './utils/constants';

function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { contract, account, isAdmin, connectWallet, disconnectWallet } = useContract();
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const savedRole = localStorage.getItem('userRole') as UserRole;
        if (savedRole && account) {
            setUserRole(savedRole);
        }
    }, [account]);

    useEffect(() => {
        if (userRole) {
            localStorage.setItem('userRole', userRole);
            navigate(userRole === 'admin' ? '/admin' : '/vote');
        } else {
            localStorage.removeItem('userRole');
            if (location.pathname !== '/') navigate('/');
        }
    }, [userRole, navigate, location.pathname]);

    const showNotification = (message: string, type: NotificationType) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleWalletConnect = async () => {
        const connected = await connectWallet();
        if (connected) {
            showNotification('Wallet connected successfully!', 'success');
        } else {
            showNotification('Please install MetaMask!', 'error');
        }
    };

    const handleLogin = () => {
        if (!username || !password) {
            showNotification('Please enter username and password', 'error');
            return;
        }

        if (username === DEMO_CREDENTIALS.ADMIN.username && password === DEMO_CREDENTIALS.ADMIN.password) {
            if (!isAdmin) {
                showNotification('You are not the admin account!', 'error');
                return;
            }
            setUserRole('admin');
            showNotification('Admin login successful!', 'success');
            setUsername('');
            setPassword('');
        } else if (username === DEMO_CREDENTIALS.USER.username && password === DEMO_CREDENTIALS.USER.password) {
            setUserRole('user');
            showNotification('User login successful!', 'success');
            setUsername('');
            setPassword('');
        } else {
            showNotification('Invalid credentials!', 'error');
        }
    };

    const handleLogout = () => {
        setUserRole(null);
        localStorage.removeItem('userRole');
        navigate('/');
        showNotification('Logged out successfully', 'info');
    };

    const handleDisconnect = () => {
        disconnectWallet();
        setUserRole(null);
        localStorage.removeItem('userRole');
        navigate('/');
        showNotification('Wallet disconnected', 'info');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>🗳️ Blockchain Voting</Text>
                <View style={styles.headerRight}>
                    {account && (
                        <Text style={styles.address}>
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </Text>
                    )}
                    {userRole && (
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                <Text style={styles.buttonText}>Logout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                                <Text style={styles.buttonText}>Disconnect</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {!account && (
                        <TouchableOpacity style={styles.connectButton} onPress={handleWalletConnect}>
                            <Text style={styles.buttonText}>Connect Wallet</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {notification && (
                <View style={[
                    styles.notification,
                    notification.type === 'success' && styles.notificationSuccess,
                    notification.type === 'error' && styles.notificationError,
                    notification.type === 'info' && styles.notificationInfo,
                ]}>
                    <Text style={styles.notificationText}>{notification.message}</Text>
                </View>
            )}

            <Routes>
                <Route
                    path="/"
                    element={
                        !account ? (
                            <View style={styles.loginContainer}>
                                <View style={styles.loginCard}>
                                    <Text style={styles.loginIcon}>🔐</Text>
                                    <Text style={styles.loginTitle}>Welcome to Blockchain Voting</Text>
                                    <Text style={styles.loginSubtitle}>Connect your wallet to continue</Text>
                                    <TouchableOpacity style={styles.primaryButton} onPress={handleWalletConnect}>
                                        <Text style={styles.primaryButtonText}>🦊 Connect MetaMask</Text>
                                    </TouchableOpacity>
                                    <View style={styles.infoBox}>
                                        <Text style={styles.infoText}>
                                            💡 Make sure MetaMask is installed and connected to Hardhat localhost network
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.loginContainer}>
                                <View style={styles.loginCard}>
                                    <Text style={styles.loginIcon}>👤</Text>
                                    <Text style={styles.loginTitle}>Login to Continue</Text>
                                    <Text style={styles.loginSubtitle}>Enter your credentials</Text>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Username</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter username"
                                            placeholderTextColor="#666"
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter password"
                                            placeholderTextColor="#666"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>

                                    <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                                        <Text style={styles.primaryButtonText}>Login</Text>
                                    </TouchableOpacity>

                                    {import.meta.env.DEV && (
                                        <View style={styles.demoCredentials}>
                                            <Text style={styles.demoTitle}>📋 Demo Credentials (Dev Only)</Text>
                                            <View style={styles.credentialRow}>
                                                <Text style={styles.credentialLabel}>Admin:</Text>
                                                <Text style={styles.credentialValue}>admin / admin</Text>
                                            </View>
                                            <View style={styles.credentialRow}>
                                                <Text style={styles.credentialLabel}>User:</Text>
                                                <Text style={styles.credentialValue}>user / user</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )
                    }
                />
                <Route
                    path="/admin"
                    element={
                        userRole === 'admin' ? (
                            <AdminDashboard contract={contract} showNotification={showNotification} />
                        ) : (
                            <View style={styles.unauthorized}>
                                <Text style={styles.unauthorizedText}>Unauthorized Access</Text>
                            </View>
                        )
                    }
                />
                <Route
                    path="/vote"
                    element={
                        userRole === 'user' ? (
                            <VotingPage contract={contract} account={account} showNotification={showNotification} />
                        ) : (
                            <View style={styles.unauthorized}>
                                <Text style={styles.unauthorizedText}>Unauthorized Access</Text>
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
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
        minHeight: '100%' as any,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: '#2d2d44',
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    address: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    disconnectButton: {
        backgroundColor: '#6b7280',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    notification: {
        padding: 16,
        margin: 20,
        borderRadius: 8,
        marginBottom: 0,
    },
    notificationSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: '#10b981',
    },
    notificationError: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    notificationInfo: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: '#6366f1',
    },
    notificationText: {
        color: '#fff',
        fontSize: 14,
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loginCard: {
        backgroundColor: '#1a1a2e',
        padding: 40,
        borderRadius: 16,
        width: '100%',
        maxWidth: 450,
        borderWidth: 1,
        borderColor: '#2d2d44',
    },
    loginIcon: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 16,
    },
    loginTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    loginSubtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 32,
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#6366f1',
    },
    infoText: {
        color: '#6366f1',
        fontSize: 13,
        lineHeight: 20,
    },
    connectButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    connectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#0f0f23',
        color: '#fff',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2d2d44',
        fontSize: 16,
        outlineWidth: 0,
    },
    submitButton: {
        backgroundColor: '#6366f1',
        color: '#fff',
        padding: 14,
        borderRadius: 8,
        borderWidth: 0,
        fontSize: 16,
        fontWeight: '600',
        cursor: 'pointer' as any,
    },
    demoCredentials: {
        padding: 20,
        backgroundColor: '#0f0f23',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2d2d44',
    },
    demoTitle: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 12,
        fontWeight: '600',
    },
    credentialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    credentialLabel: {
        color: '#888',
        fontSize: 14,
    },
    credentialValue: {
        color: '#6366f1',
        fontSize: 14,
        fontWeight: '600',
    },
    demoText: {
        color: '#6366f1',
        fontSize: 14,
        marginBottom: 4,
    },
    unauthorized: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unauthorizedText: {
        color: '#ef4444',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
