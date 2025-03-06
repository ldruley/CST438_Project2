import {StyleSheet, Image, Platform, View, Text, TextInput, TouchableOpacity, Button, ScrollView} from 'react-native';
// import { Header } from '@rneui/themed';
// import LinearGradient from 'react-native-linear-gradient';
// import {FontAwesome} from "@expo/vector-icons";


import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {useState} from "react";

interface CustomInputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean; // Optional prop
}
const CustomInput: React.FC<CustomInputProps> = ({ placeholder, value, onChangeText, secureTextEntry = false }) => {
    return (
        <TextInput
            placeholder={placeholder}
            style={styles.input}
            placeholderTextColor="#aaa"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
        />
    );
};

export default function TabTwoScreen() {
    const[userName,setUsername]= useState(''); //rn its being used by all text input, will probably affect search? make another to prevent that
    const [password,setPassword] = useState('');
    const [password2,setPassword2]= useState('');
    const handleConfirmName = async () =>{
        // broken, lol
        //check username slot filled, check if it exists, then change userName
        if(!userName){
            console.log("empty!");
        }
        else{
            //check username vs db
            console.log("Username 'set'!");
        }

    }
    const handleConfirmPass = async ()=>{
        //check if the 2 match, then update password
        if(!password && !password2){
            // if both empty
            console.log("empty both!");
        }
        else if(!password|| !password2){
            console.log("gotta fill both?");
        }
        else {
            //if
            if( password!=password2){
                console.log("no match!");
            }
            else{
                console.log("set password!");
                {/*because user already exists, the name/pass method have to be the update ver*/}
            }

        }
    }

    const handleDelete = async ()=>{
        console.log("GoodBye! :(");
    //     asks for confirmation: if yes, kicks user back to main menu
    }
    const handleAdminViewAll = async ()=>{
        console.log("showing all users!");
    }
    const handleAdminCreate =async () =>{
        console.log("gonna make new guy!");
    }
    const handleAdminDelete = async() =>{
        console.log("gonna find someone to delete!");
    }
    const handleAdminEdit = async() =>{
        console.log("gonna find someone to edit!");
    }

    const isAdmin =true;
  return (

      <ScrollView style={styles.container} contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}>
          {/*<Button title={"debugging for admin"} onPress={handleAdminButton}/>*/}

          {/*<Text style={styles.title}>Create Account {isAdmin && ( <Text style={{ fontSize: 40 }}>👑</Text>)}</Text>*/}
          {/*<Text style={ styles.title}>Edit Profile ⛭</Text>*/}
          {isAdmin && ( <Text style={ styles.title}>👑 Edit Profile as Admin ⛭</Text>)}
          {!isAdmin && ( <Text style={ styles.title}>Edit Profile ⛭</Text>)}

          <Text style={ styles.h5}> Current UserName: xxx</Text>

          <CustomInput placeholder={"Username"} value={userName} onChangeText={setUsername}/>
              <TouchableOpacity style={styles.button} >
                  <Text style={styles.buttonText} onPress={handleConfirmName}>Confirm Name Change</Text>
              </TouchableOpacity>

          <Text style={ styles.h5}>Change pass</Text>
            <CustomInput placeholder={"Password"} value={password} onChangeText={setPassword} secureTextEntry={true}/>
          <Text style={ styles.h5}>ReEnter new pass</Text>
            <CustomInput placeholder={"Password"} value={password2} onChangeText={setPassword2} secureTextEntry={true}/>
          <TouchableOpacity style={styles.button} >
              <Text style={styles.buttonText} onPress={handleConfirmPass}>Confirm Password Change</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonDelete} >
              <Text style={styles.buttonText} onPress={handleDelete}>Delete Account!</Text>
          </TouchableOpacity>

          {isAdmin &&(
              <View  style={styles.subContainer} >
                  <Text style={ styles.h5} >Admin Settings</Text>
                  {isAdmin && ( <Text style={ styles.title}>👑 Admin Stuff </Text>)}

                  <TouchableOpacity style={styles.adminButton} onPress={handleAdminViewAll}>
                      {/*display all users somehow: new page or somewhere here*/}
                      <Text style={styles.buttonText}>View all users</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.adminButton} onPress={handleAdminCreate}>
                      {/*opens a menu: same thing as create account*/}
                      <Text style={styles.buttonText}>Create Users</Text>
                  </TouchableOpacity>

                  <CustomInput placeholder={"Username"} value={userName} onChangeText={setUsername}/>
                  <CustomInput placeholder={"Password"} value={password} onChangeText={setPassword}/>

                  <TouchableOpacity style={styles.button} >
                      <Text style={styles.buttonText}>Create User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.adminButton} onPress={handleAdminDelete}>
                      {/*opens a menu:decide user, delete user*/}
                      <Text style={styles.buttonText}>Delete Users</Text>
                  </TouchableOpacity>
                  <CustomInput placeholder={"Search Username to DELETE"} value={userName} onChangeText={setUsername}/>


                  <TouchableOpacity style={styles.adminButton}>
                      {/*opens a menu: decide user, do same thing as edit profile */}
                      <Text style={styles.buttonText}>Update Users</Text>
                  </TouchableOpacity>
                  <CustomInput placeholder={"Search Username to UPDATE"} value={userName} onChangeText={setUsername}/>
              </View>
          )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
        backgroundColor: "#fffbeb",
    },
    subContainer:{
        width: "80%",
        // flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e3d4c8",
        marginBottom:30,
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
        marginBottom:30,
        width: "80%",
        justifyContent:"center",
    },
    buttonDelete: {
        backgroundColor: "#db3030",
        padding: 30,
        borderRadius: 10,
        marginTop: 10,
        marginBottom:30,
        width: "80%",
        justifyContent:"center",
    },
    adminButton: {
        backgroundColor: "#9639cc",
        padding: 30,
        borderRadius: 10,
        marginTop: 10,
        marginBottom:30,
        width: "80%",
        justifyContent:"center",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        textAlign:"center",
        justifyContent:"center",
    },
    h5: {
        fontSize: 18,
        fontWeight: 'normal',
    },
    h6:{
        fontSize: 16,
        fontWeight: 'normal',
    }
});
