import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}> {/* Gradient background */}
            <View style={styles.overlay}>
                <Text style={styles.title}>Create Account</Text>

                {/* Input Fields */}
                <Text style={styles.subTitle}>Enter Username</Text>
                <TextInput
                    placeholder="Username"
                    style={styles.input}
                    placeholderTextColor="#aaa"
                    value={username}
                    onChangeText={setUsername}
                />
                <Text style={styles.subTitle}>Enter Password</Text>
                <TextInput
                    placeholder="Password"
                    style={styles.input}
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                {/* Sign Up Button */}
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay for readability
        alignItems: 'center',
        width:'50%',
        height:'90%'
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        marginBottom: 20,
        color: 'white', 
    },
    subTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 5,  // Adjust to control the space between text and input
        color: 'white',
        alignSelf: 'flex-start',  // Align subtitle text to the left
    },
    input: {
        width: '80%',
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        backgroundColor: 'white',
        color: 'black', 
    },
    button: {
        backgroundColor: '#1047d3',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 15,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
