import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

interface CustomAlertProps {
    isVisible: boolean;
    title: string;
    message: string;
    buttons: {
        text: string;
        style?: 'default' | 'cancel' | 'destructive';
        onPress: () => void;
    }[];
    onBackdropPress: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
         isVisible,
         title,
         message,
         buttons,
         onBackdropPress,
     }) => {
    return (
        <Modal
            isVisible={isVisible}
            backdropOpacity={0.7}
            backdropColor="#000"
            onBackdropPress={onBackdropPress}
            animationIn="fadeIn"
            animationOut="fadeOut"
            useNativeDriver={true}
            hideModalContentWhileAnimating={true}
            style={styles.modal}
        >
            <View style={styles.alertContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
                <View style={styles.buttonContainer}>
                    {buttons.map((button, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.button,
                                button.style === 'cancel' && styles.cancelButton,
                                button.style === 'destructive' && styles.destructiveButton,
                            ]}
                            onPress={button.onPress}
                        >
                            <Text
                                style={[
                                    styles.buttonText,
                                    button.style === 'cancel' && styles.cancelButtonText,
                                    button.style === 'destructive' && styles.destructiveButtonText,
                                ]}
                            >
                                {button.text}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
    },
    alertContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        maxWidth: 400,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    message: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginLeft: 10,
        borderRadius: 5,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    destructiveButton: {
        backgroundColor: '#ff6b6b',
    },
    buttonText: {
        fontSize: 16,
        color: '#4da6ff',
        fontWeight: 'bold',
    },
    cancelButtonText: {
        color: '#666',
    },
    destructiveButtonText: {
        color: 'white',
    },
});

export default CustomAlert;