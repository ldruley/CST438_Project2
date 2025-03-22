import {
    StyleSheet, Image, Platform, View, Text,
    TextInput, TouchableOpacity, Button, ScrollView, Modal,
    FlatList, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {useState,useEffect, useCallback} from "react";
// import axios from "axios";
import {sync} from "glob";
import {CustomPropertyName} from "lightningcss";
import {bool, number} from "prop-types";
import {router, useFocusEffect} from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CustomInputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean; //the "hidden" text for password
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
    //for debugging.hide this and show the usestate ver when not debugging (under trees for ctrl +f)
    const isAdmin =true;

    //for user to change name/pass
    const[userName,setUsername]= useState('');
    const[newUserName,setNewUsername]= useState('');
    const [newPassword,setNewPassword] = useState('');
    const [password2,setPassword2]= useState('');
    // const [oldPass, setOldPass]= useState('');
    const [email,setEmail]= useState('');
    //trees
    // const [isAdmin,setAdmin]= useState(false)
    //for Admin stuff
    //create user
    const[createUserName,setCreateUsername]= useState('');
    const [createPassword,setCreatePassword] = useState('');
    const [createEmail,setCreateEmail]= useState('');
    const [createTextCon,setCreateTextCon]=useState('');
    //delete user var
    const[delUserId,setDelUserId]=useState('');
    const [matches, setMatches] = useState(null);
    //edit user var
    const[editUserId,setEditUserId] = useState('');
    const[editName,setEditName]=useState('');
    const[editPass,setEditPass]=useState('');
    const[editMail,setEditMail]=useState('');
    //for delete warning
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [adminModalVisible, setAdminModalVisible] = useState(false);
    const [warnPass,setWarnPass] = useState('');

    const tempPass= "123456789";

    //stuff i stole from tierlists
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [userData, setUserData] = useState({}); //for the view all?


    const [data, setData] = useState(null);

    const resetFields = () => {
        setUsername('');
        setNewPassword('');
        setPassword2('');
        setEmail('');
        setDelUserId('');
        setEditUserId('');
        setEditName('');
        setEditPass('');
        setEditMail('');
        setWarnPass('');

    };

    useEffect(() => {
        const loadUsername = async () => {
            try {
                const storedUsername = await AsyncStorage.getItem('username');
                if (storedUsername) {
                    setUsername(storedUsername);
                }
            } catch (error) {
                console.error('Error loading username from AsyncStorage:', error);
            }
        };

        loadUsername();
    }, []);

    useFocusEffect(
        useCallback(() => {
            console.log('Screen focused - refreshing authentication data');
            setIsLoading(true);

            const fetchUserData = async () => {
                try {
                    console.log('Fetching authentication data from AsyncStorage...');
                    const token = await AsyncStorage.getItem('jwtToken');
                    const userId = await AsyncStorage.getItem('userId'); // Ensure we have user ID

                    console.log(`Token exists: ${!!token}, User ID exists: ${!!userId}`);

                    if (token && userId) {
                        setJwtToken(token);

                        // Fetch user details from the API
                        const userResponse = await fetch(`http://localhost:8080/api/users/${userId}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!userResponse.ok) {
                            throw new Error('Failed to fetch user details');
                        }

                        const userData = await userResponse.json();
                        console.log('Fetched user data:', userData);

                        // Store user data in state
                        setUserId(userData.id);
                        setUsername(userData.username);
                        setEmail(userData.email);
                        // setOldPass(userData.password);
                        //trees
                        // setAdmin(userData.isAdmin);



                        // Store in AsyncStorage (optional, if needed elsewhere)
                        await AsyncStorage.setItem('username', userData.username);
                        await AsyncStorage.setItem('email', userData.email);

                    } else {
                        console.log('No JWT token or user ID found, redirecting to login');
                        setJwtToken(null);
                        setUserId(null);
                        setUsername('');
                        setEmail('');
                        setIsLoading(false);
                        router.replace('/login');
                    }
                } catch (error) {
                    console.error('Error fetching authentication data:', error);
                    setJwtToken(null);
                    setUserId(null);
                    setUsername('');
                    setEmail('');
                    setIsLoading(false);
                }
            };

            fetchUserData();
        }, [])
    );


    //current user methods, all these should refer to logged in user
    const handleConfirmName = async () =>{
        //call back end: updateUser
        //check username slot filled, check if it exists, then change userName
        if(!userName){
            console.log("input new userName!");
        }
        else{
            //check username vs db?
            const edited_user={
                username:newUserName,

            };
            try{

                const response = await fetch(`http://localhost:8080/api/users/${userId}`,{
                    method:"PATCH",
                    headers:{
                        'Authorization': `Bearer ${jwtToken}`,
                        "Content-Type": "application/json",
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(edited_user),
                    mode: "cors",
                });
                if (response.ok){
                    console.log("User edited (username)");
                    // resetFields()
                }
                else{
                    console.log("failed to edit user")
                }


            }catch (e){
                console.error("Error editing user: ", e);
            }


        }

    }
    const handleConfirmPass = async ()=>{
        //call back end: updateUser
        //check if the 2 match, then update password
        if(!newPassword && !password2){
            // if both empty
            console.log("empty both!");
        }
        else if(!newPassword|| !password2){
            console.log("gotta fill both?");
        }
        else {
            //if
            if( newPassword!=password2){
                console.log("no match!");
            }
            else{

                //TODO works, but "ResponseEntity.ok("Password changed successfully");" gets scared

                try {
                    const response = await fetch(`http://localhost:8080/auth/change-password?username=${userName}&newPassword=${newPassword}&userId=${userId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`,
                            'Accept': 'application/json',
                        },
                        mode: "cors",
                    });

                    const data = await response.json();

                    if (response.ok) {
                        console.log('Password changed successfully:', data);
                        // Optionally, inform the user with a success message
                    } else {
                        console.error('Failed to change password:', data);
                        // Handle error case, inform the user about failure
                    }
                } catch (error) {
                    console.error('Error changing password:', error);
                    // Handle network or other errors
                }
            }

        }
    }

    const handleDelete = async ()=>{
        //call back end: deleteUser
        console.log("GoodBye! :(");

        // router.push("/home");
        // router.replace("http://localhost:8081/home")
        //     asks for confirmation: if yes,deletes user then kicks user back to main menu
        try{

            const response = await fetch(`http://localhost:8080/api/users/deleteUser/${userId}`,{
                method:"DELETE",
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    "Content-Type": "application/json",
                    'Accept': 'application/json'
                },
                mode: "cors",
            });
            if (response.ok){
                console.log("User deleted");
                router.replace("http://localhost:8081/home")
            }
            else{
                console.log("failed to delete user")
            }
        }
        catch (e){
            console.error("Error deleting said user: ",e)
        }
    }
    //----admin methods----
    //TODO all of these need the admin ver (idk how admin gets other user tokens)
    //admin methods - admin can choose who to create. can admin delete self?
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:8080/api/users/all", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                mode: "cors",  // Ensure that CORS is enabled
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched Users:", data); // Print to console
            setData(data); // Store in state
            console.log("Updated Data:", data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleAdminViewAll = async ()=>{
        //call backend: getAllUsers
        await fetchUsers();

    }
    const handleAdminCreate = async () => {
        if (!createUserName || !createPassword || !createEmail) {
            console.error("All fields (username, password, email) are required");
            return;
        }

        setIsLoading(true);

        try {
            console.log("Starting account creation process...");

            const params = new URLSearchParams();
            params.append('username', createUserName);
            params.append('email', createEmail);
            params.append('password', createPassword);

            const createResponse = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            console.log("Response status:", createResponse.status);
            const responseText = await createResponse.text();
            console.log("Response body:", responseText);

            if (!createResponse.ok) {
                setIsLoading(false);
                return;
            }

            console.log("Account created successfully");

            // Set success message BEFORE alert
            setCreateTextCon(`User: ${createUserName} created!`);

            // Delay for better UI update
            setTimeout(() => {
                Alert.alert("Success", "Account has been created.", [
                    {
                        text: "OK",
                        onPress: () => {
                            setIsLoading(false);
                            setCreateUsername('');
                            setCreateEmail('');
                            setCreatePassword('');
                        }
                    }
                ]);
            }, 100);

        } catch (err) {
            console.error('Error during account creation:', err);
            setIsLoading(false);
        }
    };

    const handleAdminEdit = async() =>{
        console.log("gonna find someone to edit!");


        if(!editUserId){
            console.error("Input a user id to edit!");
            return;
        }

        const edited_user={
            username:editName,
            password:editPass,
            email:editMail,
            isAdmin:false,
        };
        try{

            const response = await fetch(`http://localhost:8080/api/users/${editUserId}`,{
                method:"PATCH",
                headers:{
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(edited_user),
                mode: "cors",
            });
            if (response.ok){
                console.log("User edited");
                resetFields();
            }
            else{
                console.log("failed to edit user")
            }


        }catch (e){
            console.error("Error editing user: ", e);
        }


    }
    const handleAdminDelete = async() =>{

        if (!delUserId){
            console.error("Input a user to delete!");
            return;
        }

        setAdminModalVisible(true);

        try{

            const response = await fetch(`http://localhost:8080/api/users/${delUserId}`,{
                method:"DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                mode: "cors",
            });
            if (response.ok){
                console.log("User deleted");
                resetFields();
            }
            else{
                console.log("failed to delete user")
            }
        }
        catch (e){
            console.error("Error deleting said user: ",e)
        }


    }











    return (

        <ScrollView style={styles.container} contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}>
            <LinearGradient colors={['#000000', '#808080']} style={styles.subContainer2}>


                {isAdmin && ( <Text style={ styles.title}>👑 Edit Profile as Admin ⛭</Text>)}
                {!isAdmin && ( <Text style={ styles.title}>Edit Profile ⛭</Text>)}

                <Text style={ styles.h5}> Current UserName: {userName}</Text>
                <View style={[styles.overlay]}>
                    <CustomInput placeholder={"Username"} value={newUserName} onChangeText={setNewUsername}/>
                    <TouchableOpacity style={styles.button} >
                        <Text style={styles.buttonText} onPress={handleConfirmName}>Confirm Name Change</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.overlay}>
                    <Text style={ styles.h5}>Change pass</Text>
                    <CustomInput placeholder={"Password"} value={newPassword} onChangeText={setNewPassword} secureTextEntry={true}/>
                    <Text style={ styles.h5}>ReEnter new pass</Text>
                    <CustomInput placeholder={"Password"} value={password2} onChangeText={setPassword2} secureTextEntry={true}/>
                    <TouchableOpacity style={styles.button} >
                        <Text style={styles.buttonText} onPress={handleConfirmPass}>Confirm Password Change</Text>
                    </TouchableOpacity>
                </View>


                <TouchableOpacity style={styles.buttonDelete} >
                    <Text style={styles.buttonText} onPress={()=>setUserModalVisible(true)}>Delete Account!</Text>
                </TouchableOpacity>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={userModalVisible}
                    onRequestClose={() => setUserModalVisible(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalText}>Are you sure you want to delete account?{"\n\n"}Type in password to confirm...</Text>
                            <TextInput
                                // make user input their password
                                style={styles.input}
                                placeholder="Current Password"
                                placeholderTextColor="#aaa"
                                value={warnPass}
                                onChangeText={(text) => setWarnPass(text)}
                            />
                            <Button
                                title="Cancel"
                                onPress={() => setUserModalVisible(false)}
                            />
                            <Button
                                color="#e74c3c"
                                title={"Confirm"}
                                onPress={async () => {
                                    //TODO- compare input w/ current password (auth?)
                                    if (matches) {
                                        await handleDelete();
                                        setUserModalVisible(false);
                                        setWarnPass('');
                                    } else {
                                        console.log("Incorrect password");
                                    }
                                }}
                            />
                        </View>
                    </View>
                </Modal>

                {isAdmin &&(
                    <View  style={styles.subContainer} >
                        <Text style={ styles.h5} >Admin Settings</Text>
                        {isAdmin && ( <Text style={ styles.title}>👑 Admin Stuff </Text>)}
                        <View style={styles.overlay}>
                            <TouchableOpacity style={styles.adminButton} onPress={handleAdminViewAll}>
                                {/*display all users somehow: new page or somewhere here*/}
                                <Text style={styles.buttonText}>View all users</Text>
                            </TouchableOpacity>
                            <View style={styles.container}>
                                {/*<Text style={styles.h5} >Users List</Text>*/}
                                <FlatList
                                    data={data}
                                    keyExtractor={(item) => item.id.toString()} // Unique key for each item
                                    renderItem={({ item }) => (
                                        <View >
                                            <Text style={styles.h5}>
                                                <Text style={{ fontWeight: 'bold' }}>id:</Text> {item.id},
                                                <Text style={{ fontWeight: 'bold' }}> username:</Text> {item.username},
                                                <Text style={{ fontWeight: 'bold' }}> email:</Text> {item.email}
                                            </Text>
                                        </View>
                                    )}
                                />

                            </View>
                        </View>

                        <View style={styles.overlay}>


                            <CustomInput placeholder={"Username"} value={createUserName} onChangeText={setCreateUsername}/>
                            <CustomInput placeholder={"Password"} value={createPassword} onChangeText={setCreatePassword}/>
                            <CustomInput placeholder={"Set Email"} value={createEmail} onChangeText={setCreateEmail}/>

                            <TouchableOpacity style={styles.button} >
                                <Text style={styles.buttonText} onPress={handleAdminCreate}>Create User</Text>
                            </TouchableOpacity>

                                {createTextCon ? <Text style={styles.createCon}>{createTextCon}</Text> : null}



                        </View>

                        <View style={styles.overlay}>
                            <TouchableOpacity
                                style={styles.adminButton}
                                onPress={() => {
                                    console.log('delUserId:', delUserId);

                                    if (delUserId !=="") {
                                        setAdminModalVisible(true);
                                    } else {
                                        console.log("Insert User ID to delete");
                                    }
                                }}
                            >

                                <Text style={styles.buttonText}>Delete Users</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                placeholder={"Enter User ID to delete user"}
                                placeholderTextColor="#aaa"
                                keyboardType={"numeric"}
                                onChangeText={(text)=> setDelUserId(text)}
                                value={delUserId}

                            />
                        </View>

                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={adminModalVisible}
                            onRequestClose={() => setAdminModalVisible(false)}
                        >
                            <View style={styles.modalBackground}>
                                <View style={styles.modalContainer}>
                                    <Text style={styles.modalText}>
                                        Are you sure you want to delete the account?{"\n\n"}Type in their password to confirm...
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Current Password"
                                        placeholderTextColor="#aaa"
                                        value={warnPass}
                                        onChangeText={(text) => setWarnPass(text)}
                                    />
                                    <Button
                                        title="Cancel"
                                        onPress={() => setAdminModalVisible(false)}
                                    />
                                    <Button
                                        color="#e74c3c"
                                        title={"Confirm"}
                                        onPress={async () => {
                                            //TODO edit this to check someone's pass Admin/user?
                                            if (warnPass === tempPass) {
                                                await handleAdminDelete();
                                                setAdminModalVisible(false);
                                                setWarnPass('');
                                            } else {
                                                console.log("Incorrect password");
                                            }
                                        }}
                                    />
                                </View>
                            </View>
                        </Modal>


                        <View style={styles.overlay}>
                            <TouchableOpacity style={styles.adminButton} onPress={handleAdminEdit}>
                                <Text style={styles.buttonText}>Update User</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                placeholder={"Enter User ID to edit user"}
                                placeholderTextColor="#aaa"
                                keyboardType={"numeric"}
                                onChangeText={(text)=> setEditUserId(text)}
                                value={editUserId}

                            />
                            <CustomInput placeholder={"Edit Username"} value={editName} onChangeText={setEditName}/>
                            <CustomInput placeholder={"Edit Password"} value={editPass} onChangeText={setEditPass}/>
                            <CustomInput placeholder={"Edit Email"} value={editMail} onChangeText={setEditMail}/>

                        </View>

                    </View>
                )}
            </LinearGradient>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
        // backgroundColor: "#fffbeb",
    },
    subContainer:{
        width: "80%",
        // flex: 1,
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: "#e3d4c8",
        marginBottom:30,
    },
    subContainer2:{
        width: "100%",
        // flex: 1,
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: "#e3d4c8",
        marginBottom:30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: 'white',
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
        color: 'white',
    },
    h6:{
        fontSize: 16,
        fontWeight: 'normal',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 18,
        marginBottom: 20,
    },
    overlay: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        width: '80%',
        marginBottom:10,
    },

    error: {
        color: '#ff6b6b',
        marginBottom: 10,
        textAlign: 'center',
    },
    delBtn:{
        color:'red'
    },
    createCon:{
        color:'#94ff57'
    }

});