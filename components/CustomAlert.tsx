import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { CustomTheme } from '@/constants/Colors';

export interface AlertButton {
  text?: string;
  onPress?: ((value?: string) => void) | undefined;
  isPreferred?: boolean | undefined;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  cancelable?: boolean;
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark';
  onDismiss?: (() => void) | undefined;
}

export type AlertType = 'default' | 'plain-text' | 'secure-text' | 'login-password';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: AlertType;
  defaultValue?: string;
  keyboardType?: string;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  type = 'default',
  defaultValue = '',
  keyboardType = 'default',
  onClose,
}) => {
  const { colors } = useTheme() as CustomTheme;
  const [inputValue, setInputValue] = useState(defaultValue);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress(type === 'plain-text' || type === 'secure-text' ? inputValue : undefined);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.background + 'AA' }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.primaryText }]}>{title}</Text>

          {/* Message */}
          {message && <Text style={[styles.message, { color: colors.secondaryText }]}>{message}</Text>}

          {/* Input for prompts */}
          {(type === 'plain-text' || type === 'secure-text') && (
            <TextInput
              style={[styles.input, { borderColor: colors.borders, color: colors.primaryText }]}
              value={inputValue}
              onChangeText={setInputValue}
              secureTextEntry={type === 'secure-text'}
              keyboardType={keyboardType}
              placeholder="Enter here..."
              placeholderTextColor={colors.secondaryText}
            />
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive'
                    ? { backgroundColor: colors.error }
                    : button.style === 'cancel'
                      ? { backgroundColor: colors.borders }
                      : { backgroundColor: colors.primary },
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text
                  style={{
                    color: colors.onPrimaryText,
                    fontWeight: button.isPreferred ? 'bold' : 'normal',
                    textAlign: 'center',
                  }}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
});

export default CustomAlert;
