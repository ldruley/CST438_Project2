import {StyleSheet, Image, Platform, View, Text, TextInput, TouchableOpacity} from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {useState} from "react";

export default function TabTwoScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
  return (
      <View style={styles.container}>
          <Text style={styles.title}>Log In</Text>

          <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#aaa"
              value={username}
              onChangeText={setUsername}
          />

          <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} >
              <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
      </View>

  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fffbeb",
    },
    title: {
        fontSize: 36,
        fontWeight: "900",
        marginBottom: 20,
    },
    input: {
        width: "80%",
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "black",
        borderRadius: 20,
        backgroundColor: "white",
    },
    button: {
        backgroundColor: "#1047d3",
        padding: 30,
        borderRadius: 10,
        marginTop: 10,
        width: "80%",
        justifyContent:"center",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        textAlign:"center",
        justifyContent:"center",
    },

});