import { StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SKY AVENIR</Text>
      <Text style={styles.text}>Login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  logo: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#082B4C',
  },

  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#738293',
  },
});