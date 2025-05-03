import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Thêm StyleSheet

const OnBoardingScreen = () => {
  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#009990', '#F6F7F9']}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={styles.firstContainer}>
        <View>
          <Image source={require('@/assets/logo.png')} style={styles.logo} />
          <Image source={require('@/assets/onboarding/shape_9.png')} />
        </View>

        <View style={styles.titleWrapper}>
          <Image
            source={require('@/assets/onboarding/shape_3.png')}
            style={styles.titleTextShape1}
          />
          <Text style={[styles.titleText, { fontFamily: 'Raleway_700Bold' }]}>
            Bắt đầu học cùng
          </Text>
          <Image
            source={require('@/assets/onboarding/shape_2.png')}
            style={styles.titleTextShape2}
          />
        </View>

        <View>
          <Image
            source={require('@/assets/onboarding/shape_6.png')}
            style={styles.titleShape3}
          />
          <Text style={[styles.titleText, { fontFamily: 'Raleway_700Bold' }]}>
            EduBridge
          </Text>
        </View>

        <View style={styles.dscpWrapper}>
          <Text style={[styles.dscpText, { fontFamily: 'Nunito_400Regular' }]}>
            Nền tảng học tập cá nhân hóa của bạn
          </Text>
          <Text style={[styles.dscpText, { fontFamily: 'Nunito_400Regular' }]}>
            Học qua video, câu đố và bài tập
          </Text>
        </View>

        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => router.push('/(routes)/welcome-intro')}
        >
          <Text style={[styles.buttonText, { fontFamily: 'Nunito_700Bold' }]}>
            Bắt đầu ngay
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// Định nghĩa styles cục bộ
const styles = StyleSheet.create({
  firstContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  titleText: {
    fontSize: 24,
    color: '#000',
  },
  titleTextShape1: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  titleTextShape2: {
    width: 20,
    height: 20,
    marginLeft: 10,
  },
  titleShape3: {
    width: 30,
    height: 30,
    marginBottom: 10,
  },
  dscpWrapper: {
    marginVertical: 20,
    alignItems: 'center',
  },
  dscpText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  buttonWrapper: {
    backgroundColor: '#009990',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default OnBoardingScreen;