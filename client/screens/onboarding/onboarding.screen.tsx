import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

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

// Định nghĩa styles theo phong cách từ tệp mẫu
const styles = StyleSheet.create({
  firstContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  logo: {
    width: wp('23%'),
    height: hp('10%'),
  },
  titleWrapper: {
    flexDirection: 'row',
  },
  titleTextShape1: {
    position: 'absolute',
    left: -28,
    top: -20,
    width: wp('5%'), // Điều chỉnh kích thước tương đối
    height: hp('3%'),
  },
  titleText: {
    fontSize: hp('4%'),
    textAlign: 'center',
    color: 'white', // Màu chữ giống với mẫu
  },
  titleTextShape2: {
    position: 'absolute',
    right: -40,
    top: -20,
    width: wp('5%'),
    height: hp('3%'),
  },
  titleShape3: {
    position: 'absolute',
    left: 60,
    width: wp('8%'), // Điều chỉnh kích thước tương đối
    height: hp('4%'),
  },
  dscpWrapper: {
    marginTop: 30,
  },
  dscpText: {
    textAlign: 'center',
    color: '#575757',
    fontSize: hp('2%'),
  },
  buttonWrapper: {
    backgroundColor: '#009990',
    width: wp('92%'),
    paddingVertical: 18,
    borderRadius: 4,
    marginTop: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: hp('2%'), // Điều chỉnh kích thước chữ tương đối
  },
});

export default OnBoardingScreen;