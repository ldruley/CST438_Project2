import { StyleSheet, Image, Platform, View, TextInput, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import { FunctionComponent  } from 'react';
import React from 'react';
import {useState} from "react";
import TierList from '@/app/TierList';
// import { Collapsible } from '@/components/Collapsible';
// import { ExternalLink } from '@/components/ExternalLink';
// import ParallaxScrollView from '@/components/ParallaxScrollView';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';
// import { IconSymbol } from '@/components/ui/IconSymbol';

const mainTier: React.FC=() => {
  const [tierItem, setTierItem] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const tiers = ['Splus', 'S', 'A', 'B', 'C', 'D', 'F'];
  const [tierListProps, setTierListProps] = useState({
    Splus: [],
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: []
  });
  const handleSubmit = () => {
    console.log("handleSubmit")
    // if (tierItem.trim() && selectedTier) {
      // Convert selectedTier to match the key in tierListProps
      const tier = selectedTier === 'S+' ? 'Splus' : selectedTier as keyof typeof tierListProps;
      
      // Create a new state object with the added item
      setTierListProps(prev => ({
        ...prev,
        [tier]: [...(prev[tier] || []), tierItem]
      }));
      setTierItem(""); // Reset the input field
      console.log(tierListProps[tier]); // Log the updated tier list
      // Reset the input field
      setTierItem("");
    // }
  };
  return (
    <View style={styles.background}>
      <View style={styles.tierContainer}>
        <TierList {...tierListProps} />
      </View>
      {/* Create Select element with values S+,A,B,C,D,F */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTier}
          onValueChange={(itemValue) => setSelectedTier(itemValue)}
          style={styles.picker}
        >
          {tiers.map((tier) => (
            <Picker.Item key={tier} label={tier} value={tier} />
          ))}
        </Picker>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter Item"
        placeholderTextColor="#aaa"
        key = "ItemInput"
        onChange={(event) => setTierItem(event.nativeEvent.text)}
        value={tierItem}
        
        
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

export default mainTier;

const styles = StyleSheet.create({
  background:{
    backgroundColor:"blue",
    width:'100%',
    height:'100%',
    justifyContent:'center',
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,

  },
  tierContainer:{
    width: "60%",
    height: "60%",
    borderWidth: 1,
    justifyContent:"center",
    margin:"auto",
    display:"flex",
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
pickerContainer:{
  width: '10%',
  height: '10%',

},
picker:{
  width:'100%',
  height:'100%',
},
});
