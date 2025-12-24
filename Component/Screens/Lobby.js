import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search, X, Users, Clock, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { useSocket } from '../../Context/Socket';
import { useTheme } from '../Globalfile/ThemeContext';

// const SOCKET_SERVER_URL = 'http://192.168.1.10:3000/';

export default function Lobby() {
    /* ================= STATE & REFS ================= */
    const socket = useSocket();
    const { theme } = useTheme();
    const route = useRoute();
    const { difficulty, digit, symbol, timer, qm } = route.params;
    const navigation = useNavigation();

    const [isSearching, setIsSearching] = useState(false);
    // const [searchTime, setSearchTime] = useState(0); // Unused or can be used for stats
    const [playersInQueue, setPlayersInQueue] = useState(47);
    const [estimatedWait, setEstimatedWait] = useState('2-3 min');
    const [userRating, setUserRating] = useState(1847);
    const [userName, setUserName] = useState('Player');
    const [player, setPlayer] = useState();

    // Matchmaking Animation State
    const [matchFound, setMatchFound] = useState(false);
    const [opponentData, setOpponentData] = useState(null);
    const [dummyIdx, setDummyIdx] = useState(0);

    // Dummy Avatars for "Searching" animation
    const DUMMY_AVATARS = [
        'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?size=338&ext=jpg&ga=GA1.1.2008272138.1720569600&semt=ais_user',
        'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671122.jpg?size=338&ext=jpg&ga=GA1.1.2008272138.1720569600&semt=ais_user',
        'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?size=338&ext=jpg&ga=GA1.1.2008272138.1720569600&semt=ais_user',
    ];

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // We use a ref to track if we are ready to navigate vs waiting for animation
    const readyToNavigateRef = useRef(false);
    const pendingGameStartData = useRef(null);
    const hasNavigatedRef = useRef(false); // Guard against double navigation

    const socketRef = useRef(null);
    const opponentRef = useRef(null);
    const myGamePlayerIdRef = useRef(null); // To store my ephemeral socket/game ID // Store opponent info

    const storePlrId = async playerId => {
        await AsyncStorage.setItem('playerId', playerId);
    };
    /* ================= EFFECTS ================= */

    // 1. Initial User Data Load
    useEffect(() => {
        const getUserData = async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                console.log('✅ User Info:', user);
                setPlayer(user);
            }
        };
        getUserData();
    }, []);

    // 2. Searching: Cycle Dummy Avatars & Pulse
    useEffect(() => {
        let dummyInterval;
        if (isSearching && !matchFound) {
            // Cycle avatars every 800ms
            dummyInterval = setInterval(() => {
                setDummyIdx((prev) => (prev + 1) % DUMMY_AVATARS.length);
            }, 600);

            // Pulse Animation
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ]),
            );

            const rotateAnimation = Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            );

            pulseAnimation.start();
            rotateAnimation.start();

            return () => {
                pulseAnimation.stop();
                rotateAnimation.stop();
                clearInterval(dummyInterval);
            };
        } else {
            // Reset or Stop logic if needed
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);
        }
    }, [isSearching, matchFound]);

    // 3. Socket Event Listeners
    useEffect(() => {
        if (!socket) return;
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🟢 Connected to socket server');
        });

        const handleLobbyJoined = (data) => {
            console.log('📥 lobby-joined:', data);
            if (data.success && data.player && data.player.id) {
                console.log('✅ My Game UUID:', data.player.id);
                myGamePlayerIdRef.current = data.player.id;
            }
        };

        socket.on('lobby-joined', handleLobbyJoined);

        socket.on('potential-opponents', data => {
            console.log('🔥 potential-opponents:', data);
        });

        socket.on('match-found', ({ gameRoom, opponent, initialQuestionMeter }) => {
            console.log('✅ MATCH FOUND! Opponent:', opponent);
            opponentRef.current = opponent;

            // Trigger "Match Found" UI
            setOpponentData(opponent);
            setMatchFound(true);
            hasNavigatedRef.current = false; // Reset navigation guard

            // We DON'T navigate yet. We wait for game-started AND the UI delay.
            // But actually game-started might come *immediately*.
            // We will set a minimum timer for the "Match Found" screen.

            setTimeout(() => {
                readyToNavigateRef.current = true;
                // If we already received game-started data, navigate now!
                if (pendingGameStartData.current) {
                    console.log('🚀 Navigating to Game (Delayed trigger)');
                    navigateToGame(pendingGameStartData.current);
                }
            }, 2000); // 2 seconds delay to show opponent face
        });

        socket.on('game-started', (data) => {
            console.log('🚀 GAME STARTED received:', data);

            if (readyToNavigateRef.current) {
                // If 2 seconds passed since match-found
                navigateToGame(data);
            } else {
                // Wait for the timeout to trigger this
                console.log('⏳ Waiting for Match Found animation...');
                pendingGameStartData.current = data;
            }
        });

        return () => {
            socket.off('lobby-joined');
            socket.off('potential-opponents');
            socket.off('match-found');
            socket.off('game-started');
        };
    }, [socket]);


    /* ================= HELPERS ================= */
    const navigateToGame = ({ gameState, currentQuestion }) => {
        if (hasNavigatedRef.current) {
            console.log('🛑 Already navigated to game, skipping duplicate.');
            return;
        }
        hasNavigatedRef.current = true;

        navigation.navigate('MultiPlayerGame', {
            currentQuestion,
            timer,
            opponent: opponentRef.current,
            myGamePlayerId: myGamePlayerIdRef.current,
        });
        // Reset state for next time (though we are navigating away)
        setTimeout(() => {
            setIsSearching(false);
            setMatchFound(false);
            setOpponentData(null);
            pendingGameStartData.current = null;
            readyToNavigateRef.current = false;
        }, 500);
    };

    const handleStartSearch = async () => {
        setIsSearching(true);
        setMatchFound(false);
        setOpponentData(null);
        pendingGameStartData.current = null;
        readyToNavigateRef.current = false;

        // setSearchTime(0);

        try {
            const storedUserData = await AsyncStorage.getItem('userData');
            const userData = storedUserData ? JSON.parse(storedUserData) : null;
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('join-lobby', {
                    userId: userData.id,
                    username: userData.username,
                    email: userData.email,
                    rating: userData.pr?.pvp?.[difficulty] ?? 1000,
                    diff: difficulty,
                    timer: timer,
                    symbol: symbol,
                });
            } else {
                console.warn('User data not found or socket not ready');
            }
        } catch (error) {
            console.error('Error getting user data from AsyncStorage:', error);
        }

        Animated.spring(scaleAnim, {
            toValue: 0.95,
            tension: 150,
            friction: 4,
            useNativeDriver: true,
        }).start();
    };

    const handleCancelSearch = () => {
        setIsSearching(false);
        // setSearchTime(0);
        if (socketRef.current) {
            socketRef.current.emit('cancel_search');
        }
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 150,
            friction: 4,
            useNativeDriver: true,
        }).start();
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <LinearGradient
            colors={theme.backgroundGradient || ['#0B1220', '#0B1220']}
            style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text || '#ffffff' }]}>Game Lobby</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X color={theme.text || "#ffffff"} size={24} />
                </TouchableOpacity>
            </View>

            <Animated.View
                style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.playerCard, { backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.1)', borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.2)' }]}>
                    <View style={styles.ratingSection}>
                        <Star color="#ffd700" size={20} />
                        <Text style={[styles.ratingText, { color: theme.text || '#ffffff' }]}>
                            Rating:{player?.pr?.pvp[difficulty]}
                        </Text>
                    </View>
                    <Text style={[styles.playerName, { color: theme.secondaryText || '#90caf9' }]}>{userName}</Text>
                </View>

                <View style={[styles.matchCard, { backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.05)', borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)' }]}>
                    {!isSearching ? (
                        /* 1. IDLE STATE */
                        <View style={styles.readyState}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.iconBg || 'rgba(144, 202, 249, 0.1)' }]}>
                                <Search color={theme.secondaryText || "#90caf9"} size={48} />
                            </View>
                            <Text style={[styles.statusTitle, { color: theme.text || '#ffffff' }]}>Ready to Find Match</Text>
                            <Text style={[styles.statusSubtitle, { color: theme.secondaryText || '#90caf9' }]}>
                                You'll be matched with players of similar rating
                            </Text>

                            {/* <View style={styles.queueInfo}>
                                <View style={styles.infoRow}>
                                    <Users color={theme.secondaryText || "#90caf9"} size={16} />
                                    <Text style={[styles.infoText, { color: theme.secondaryText || '#90caf9' }]}>
                                        {playersInQueue} players in queue
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Clock color={theme.secondaryText || "#90caf9"} size={16} />
                                    <Text style={[styles.infoText, { color: theme.secondaryText || '#90caf9' }]}>
                                        Est. wait: {estimatedWait}
                                    </Text>
                                </View>
                            </View> */}

                            <TouchableOpacity
                                style={[styles.searchButton, { backgroundColor: theme.primary || '#FB923C' }]}
                                onPress={handleStartSearch}>
                                <Text style={[styles.searchButtonText, { color: theme.buttonText || '#ffffff' }]}>Find Match</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* 2. SEARCHING OR MATCH FOUND STATE */
                        <View style={styles.searchingState}>
                            <Animated.View
                                style={[
                                    styles.searchIconContainer,
                                    !matchFound && { // Only pulse/spin if NOT match found yet
                                        transform: [{ scale: pulseAnim }], // Removed rotate for avatar
                                    },
                                    { backgroundColor: theme.iconBg || 'rgba(144, 202, 249, 0.1)' }
                                ]}>

                                {matchFound && opponentData ? (
                                    // REAL OPPONENT
                                    <Animated.Image
                                        source={{ uri: 'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?size=338&ext=jpg&ga=GA1.1.2008272138.1720569600&semt=ais_user' }} // Fallback or real opponent image if available
                                        style={[styles.avatarImage, { opacity: 1, borderColor: theme.success || '#4ade80' }]}
                                    />
                                ) : (
                                    // DUMMY AVATARS
                                    <Animated.Image
                                        key={dummyIdx} // Key change triggers re-render
                                        source={{ uri: DUMMY_AVATARS[dummyIdx] }}
                                        style={styles.avatarImage}
                                    />
                                )}

                            </Animated.View>

                            <Text style={[styles.searchingTitle, { color: theme.text || '#ffffff' }]}>
                                {matchFound ? 'Opponent Found!' : 'Finding opponent...'}
                            </Text>
                            <Text style={[styles.searchingSubtitle, { color: theme.secondaryText || '#90caf9' }]}>
                                {matchFound
                                    ? `Playing against ${opponentData?.username || 'Opponent'}`
                                    : `Looking for players with rating ${player?.pr?.pvp[difficulty] - 100} - ${player?.pr?.pvp[difficulty] + 100}`
                                }
                            </Text>

                            {matchFound && (
                                <Text style={{ color: theme.success || '#4ade80', fontSize: 16, fontWeight: 'bold', marginTop: 10 }}>
                                    Ready to Battle...
                                </Text>
                            )}

                            {!matchFound && (
                                <TouchableOpacity
                                    style={[styles.cancelButton, { borderColor: theme.warning || '#ff9800', backgroundColor: (theme.warning || '#ff9800') + '33' }]}
                                    onPress={handleCancelSearch}>
                                    <Text style={[styles.cancelButtonText, { color: theme.warning || '#ff9800' }]}>Cancel Search</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    playerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    ratingSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    playerName: {
        color: '#90caf9',
        fontSize: 14,
        opacity: 0.8,
    },
    matchCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 30,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    readyState: { alignItems: 'center' },
    iconContainer: {
        backgroundColor: 'rgba(144, 202, 249, 0.1)',
        borderRadius: 40,
        padding: 20,
        marginBottom: 20,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    statusSubtitle: {
        fontSize: 16,
        color: '#90caf9',
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.8,
    },
    queueInfo: {
        width: '100%',
        marginBottom: 30,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        justifyContent: 'center',
    },
    infoText: {
        color: '#90caf9',
        fontSize: 14,
        marginLeft: 8,
    },
    searchButton: {
        backgroundColor: '#FB923C',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    searchButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchingState: { alignItems: 'center' },
    searchIconContainer: {
        backgroundColor: 'rgba(144, 202, 249, 0.1)',
        borderRadius: 40,
        padding: 20,
        marginBottom: 20,
    },
    searchingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    searchingSubtitle: {
        fontSize: 14,
        color: '#90caf9',
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.8,
    },
    searchStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#90caf9',
        opacity: 0.8,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 16,
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ff9800',
    },
    cancelButtonText: {
        color: '#ff9800',
        fontSize: 16,
        fontWeight: '600',
    },
    gameSettingsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    settingsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    settingLabel: {
        color: '#90caf9',
        fontSize: 14,
    },
    settingValue: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#4ade80', // Green border for found, or white for searching
        marginBottom: 20,
    },
});
