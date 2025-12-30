
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    PixelRatio,
    ScrollView,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../Globalfile/ThemeContext';
import CustomHeader from '../Globalfile/CustomHeader';

const { width, height } = Dimensions.get('window');
const scale = width / 375;
const normalize = size =>
    Math.round(PixelRatio.roundToNearestPixel(size * scale));

const UserProfile = () => {
    const Navigation = useNavigation();
    const route = useRoute();
    const { theme } = useTheme();

    // Get userId passed from previous screen
    const { userId } = route.params || {};

    console.log("🔍 UserProfile Response:", userId);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ================= FETCH USER ================= */
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                Alert.alert("Error", "User ID not found");
                Navigation.goBack();
                return;
            }

            try {
                const token = await AsyncStorage.getItem('authToken');
                const response = await fetch(
                    'http://43.204.167.118:3000/api/auth/getUserById',
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId })
                    }
                );

                const text = await response.text();
                console.log("🔍 UserProfile Raw Response:", text);

                let result;
                try {
                    result = JSON.parse(text);
                } catch (jsonError) {
                    console.log("❌ JSON Parse Error:", jsonError, "Response:", text);
                    Alert.alert("Error", "Server error (Invalid JSON)");
                    return;
                }

                if (result.success) {
                    setUserData(result.user);
                } else {
                    Alert.alert("Error", result.message || "Failed to fetch profile");
                }
            } catch (e) {
                console.log("❌ Fetch Error:", e);
                Alert.alert("Error", "Network error");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    /* ================= HELPERS ================= */
    const formatDate = d => {
        if (!d) return 'N/A';
        const date = new Date(d);
        return `${date.getDate().toString().padStart(2, '0')}-${date.toLocaleString(
            'en',
            { month: 'short' },
        )}-${date.getFullYear().toString().slice(-2)}`;
    };

    const mapCountryNameToCode = name => {
        if (!name) return '';
        const map = {
            india: 'IN',
            'united states': 'US',
            'united kingdom': 'UK',
            canada: 'CA',
            australia: 'AU',
            germany: 'DE',
            france: 'FR',
        };
        return map[name.toLowerCase()] || '';
    };

    const getFlagEmoji = code =>
        code
            ? code
                .toUpperCase()
                .replace(/./g, c =>
                    String.fromCodePoint(127397 + c.charCodeAt()),
                )
            : '';

    // ✅ Main screen content
    const Content = () => {
        const insets = useSafeAreaInsets();

        return (
            <View style={{ flex: 1, paddingTop: insets.top + 30 }}>
                {/* Custom Header outside of padded container for edge-to-edge effect */}
                <CustomHeader
                    title="USER PROFILE"
                    onBack={() => Navigation.goBack()}
                />

                <View style={styles.container}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}>

                        {loading ? (
                            <ActivityIndicator
                                size="large"
                                color="#fff"
                                style={{ marginTop: 50 }}
                            />
                        ) : (
                            <View style={styles.profileSection}>
                                {/* Profile Section */}
                                <View style={styles.profileTop}>
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={
                                                userData?.profileImage
                                                    ? { uri: userData.profileImage }
                                                    : require('../Screens/Image/dummyProfile.jpg')
                                            }
                                            style={styles.profileImage}
                                        />
                                    </View>
                                    <View style={styles.profileText}>
                                        <Text style={styles.userName}>
                                            {userData?.username || 'Unknown'}
                                        </Text>
                                        <Text style={styles.joinDate}>
                                            Status: {userData?.accountStatus?.state || 'Active'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Info */}
                                <View style={styles.userInfo}>
                                    <Text style={styles.email}>
                                        Email:{' '}
                                        <Text style={styles.emailText}>{userData?.email || 'N/A'}</Text>
                                    </Text>
                                    <Text style={styles.detail}>
                                        First Name: {userData?.firstName || 'N/A'}
                                    </Text>
                                    <Text style={styles.detail}>
                                        Last Name: {userData?.lastName || 'N/A'}
                                    </Text>
                                    <Text style={styles.detail}>
                                        Year of Birth : {userData?.dateOfBirth ? new Date(userData.dateOfBirth).getFullYear() : 'N/A'}
                                    </Text>
                                    <Text style={styles.detail}>
                                        Gender: {userData?.gender || 'N/A'}
                                    </Text>

                                    {/* Location */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.detail}>Country:</Text>
                                        {userData?.country ? (
                                            <View style={{ marginStart: 12, marginTop: -2 }}>
                                                <Text style={{ fontSize: normalize(18) }}>
                                                    {getFlagEmoji(mapCountryNameToCode(userData.country)) || userData.country}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={{ color: '#777', marginStart: 10 }}>
                                                Not Set
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Rank Tabs - Visual only */}
                                <View style={styles.tabRow}>
                                    {['E2', 'E4', 'M2', 'M4', 'H2', 'H4'].map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.tab, item === 'M4' && styles.activeTab]}>
                                            <Text
                                                style={[
                                                    styles.tabText,
                                                    item === 'M4' && styles.activeTabText,
                                                ]}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Rank Bar - Visual styling */}
                                <View style={styles.rankContainer}>
                                    <Text style={styles.rankText}>
                                        PvP Medium Rating: {userData?.pr?.pvp?.medium || 'N/A'}
                                    </Text>
                                    <View style={styles.rankBar}>
                                        <View style={[styles.rankBarFillGreen, { width: '50%' }]} />
                                        <View style={[styles.rankBarFillRed, { width: '45%' }]} />
                                    </View>
                                </View>

                                {/* Achievements */}
                                <View style={styles.achievementsContainer}>
                                    <Text style={styles.achievementTitle}>Achievements</Text>
                                    <View style={styles.achievementRow}>
                                        {['Ach. 1', 'Ach. 2', 'Ach. 3', 'Ach. 4'].map((item, index) => (
                                            <View key={index} style={styles.achievementBox}>
                                                <Text style={styles.achievementText}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        );
    };

    return theme.backgroundGradient ? (
        <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
            <Content />
        </LinearGradient>
    ) : (
        <View
            style={{
                flex: 1,
                backgroundColor: theme.backgroundColor || '#0D0D26',
            }}>
            <Content />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: normalize(10) },
    scrollContent: {
        paddingBottom: normalize(30),
        paddingHorizontal: normalize(16),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: normalize(15),
    },
    headerTitle: { color: '#fff', fontSize: normalize(18), fontWeight: '700' },
    headerSeparator: {
        height: 1,
        backgroundColor: '#94A3B8',
        opacity: 0.5,
        top: 10,
        marginHorizontal: -width * 0.05,
        marginBottom: height * 0.02,
        bottom: '1%',
    },
    profileSection: { marginVertical: normalize(10) },
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(12),
    },
    imageContainer: {
        borderWidth: 2,
        borderColor: '#444',
        borderRadius: normalize(30),
        overflow: 'hidden',
    },
    profileImage: {
        width: normalize(70),
        height: normalize(70),
    },
    profileText: { marginLeft: normalize(30) },
    userName: {
        color: '#fff',
        fontSize: normalize(18),
        fontWeight: '600',
        marginBottom: normalize(4),
    },
    joinDate: { color: '#999', fontSize: normalize(12) },
    userInfo: { marginTop: normalize(10), alignItems: 'flex-start' },
    email: { color: '#bbb', fontSize: normalize(14), marginBottom: normalize(2) },
    emailText: { color: '#4da6ff' },
    detail: {
        color: '#ccc',
        fontSize: normalize(14),
        marginVertical: normalize(2),
    },
    tabRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: normalize(35),
    },
    tab: {
        flex: 1,
        paddingVertical: normalize(8),
        alignItems: 'center',
        marginHorizontal: normalize(2),
        backgroundColor: '#1b1b3a',
        borderRadius: normalize(6),
    },
    activeTab: { backgroundColor: '#4e54c8' },
    tabText: { color: '#bbb', fontSize: normalize(14) },
    activeTabText: { color: '#fff', fontWeight: '600' },
    rankContainer: { marginTop: normalize(28) },
    rankText: {
        color: '#fff',
        fontSize: normalize(13),
        textAlign: 'center',
        marginBottom: normalize(20),
    },
    rankBar: {
        flexDirection: 'row',
        height: normalize(8),
        borderRadius: 6,
        overflow: 'hidden',
    },
    rankBarFillGreen: { backgroundColor: '#4CAF50' },
    rankBarFillRed: { backgroundColor: '#F44336' },
    achievementsContainer: { marginTop: normalize(25) },
    achievementTitle: {
        color: '#fff',
        fontSize: normalize(14),
        marginBottom: normalize(10),
        textAlign: 'center',
    },
    achievementRow: { flexDirection: 'row', justifyContent: 'space-between' },
    achievementBox: {
        flex: 1,
        backgroundColor: '#1e1e40',
        paddingVertical: normalize(10),
        marginHorizontal: normalize(4),
        borderRadius: normalize(8),
        alignItems: 'center',
    },
    achievementText: { color: '#ddd', fontSize: normalize(12) },
});

export default UserProfile;
