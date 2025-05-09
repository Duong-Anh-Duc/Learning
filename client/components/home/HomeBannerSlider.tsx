import { bannerData } from "@/constants/constants";
import { styles } from "@/styles/home/banner.style";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Raleway_700Bold, useFonts } from "@expo-google-fonts/raleway";
import { Image, View } from "react-native";
import Swiper from "react-native-swiper";

export default function HomeBannerSlider() {
  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Swiper
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        autoplay={true}
        autoplayTimeout={5}
      >
        {bannerData.map((item: BannerDataTypes, index: number) => (
          <View key={index} style={styles.slide}>
            <Image
              source={item.bannerImageUrl!}
              style={{ width: 400, height: 250 }}
            />
          </View>
        ))}
      </Swiper>
    </View>
  );
}
