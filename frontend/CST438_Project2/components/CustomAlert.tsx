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
            avoidKeyboard={true}
            statusBarTranslucent={true}
            propagateSwipe={false}
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
                            activeOpacity={0.6}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={() => {
                                onBackdropPress();
                                setTimeout(() => {
                                    button.onPress();
                                }, 150);
                            }}
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
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
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
        marginTop: 10,
        marginBottom: 5,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginLeft: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
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