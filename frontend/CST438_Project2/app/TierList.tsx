import { StyleSheet, Image, Platform, View, Dimensions, Text, TextInput } from 'react-native';
import React, { FunctionComponent, Component } from 'react';
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const tierHeight = (1 / 7)+'%';

// const tierList: FunctionComponent(props){
    
// }

// export class Component { }
// @Component({
//   selector: 'app-parent',
//   template: `
//         <View style={styles.container}>
//       {[...Array(7)].map((_, index) => (
//         <View key={index} style={styles.tier}>
//           <View style={styles.tierObject} />
//         </View>
//       ))}
//     </View>
//     `
// })
interface tierListProps{
  Splus:string[];
  S: string[];
  A: string[];
  B: string[];
  C: string[];
  D: string[];
  F: string[];
}
const tierList: React.FC<tierListProps> = (tierListProps ) => {
  const tiers =['Splus','S','A','B','C','D','F']
  return <View style={styles.container}>
    
  {[...Array(7)].map((_, index) => (
    <View key={index} style={styles.tier}>
      <Text style={styles.tierTitle}>{tiers[index]}</Text>
      
      {tierListProps[tiers[index] as keyof tierListProps].map((_, innerIndex) => (
      <Text key={innerIndex} style={styles.tierObject}>{tierListProps[tiers[index] as keyof tierListProps][innerIndex]}</Text>
      ))}
    </View>
  ))}
</View>;
};
export default tierList;

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        backgroundColor: '#ddd', // Light gray background for visibility
        justifyContent: 'center',
        alignItems: 'center',
      },
      tier: {
        width:'100%',
        height: "14%", 
        backgroundColor: '#bbb', 
        marginBottom: 2, 
        // justifyContent: 'center',
        flexDirection: 'row',
        // alignItems: 'flex-start',
        display:"flex",
        // paddingLeft: "10%", 
      },
      tierTitle:{
        height:"14%",
        padding: 10,
      },
      tierObject: {
        width: "15%", // 5% of the tier's width
        height: "14%", // Scaled height to fit nicely
        backgroundColor: '#ff5555', // Red for visibility
        borderRadius: 10,
        padding:10,
        fontSize:6,
        
      },
});

