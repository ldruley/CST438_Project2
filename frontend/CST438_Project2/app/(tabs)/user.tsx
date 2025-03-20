import {StyleSheet, Image, Platform, View, Text,
    TextInput, TouchableOpacity, Button, ScrollView, Modal} from 'react-native';
import {useState,useEffect} from "react";
// import axios from "axios";
import {sync} from "glob";
import {CustomPropertyName} from "lightningcss";
import {number} from "prop-types";
import {router} from "expo-router";

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
    //for user to change name
    const[userName,setUsername]= useState('');
    const [password,setPassword] = useState('');
    const [password2,setPassword2]= useState('');
    const [email,setEmail]= useState('');
    //delete user var
    const[deleteUser,setDeleteUser]= useState('')
    const[delUserId,setDelUserId]=useState('')
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

    const [userObject,setUserObject]= useState([]); //for print all users


    const [data, setData] = useState(null);



    //current user methods, all these should refer to logged in user
    const handleConfirmName = async () =>{
        //call back end: updateUser
        //check username slot filled, check if it exists, then change userName
        if(!userName){
            console.log("input new userName!");
        }
        else{
            //check username vs db
            console.log("Username 'set'!");
        }

    }
    const handleConfirmPass = async ()=>{
        //call back end: updateUser
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
        //call back end: deleteUser
        console.log("GoodBye! :(");

        // router.push("/home");
        // router.replace("http://localhost:8081/home")
        //     asks for confirmation: if yes,deletes user then kicks user back to main menu
    }
    //admin methods

    //admin methods - admin can choose who to create. can admin delete self?
    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/users", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                mode: "cors",  // Ensure that CORS is enabled
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched Users:", data); // Print to console
            setData(data); // Store in state
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleAdminViewAll = async ()=>{
        //call backend: getAllUsers
        await fetchUsers();
        console.log("showing all users!");
    }
    const handleAdminCreate = async () => {
        console.log("Gonna make new guy!");

        if (!userName || !password || !email) {
            console.error("All fields (username, password, email) are required");
            return;
        }

        const newUser = {
            username: userName,
            password: password,
            email: email,
            isAdmin: false,
        };

        try {
            const response = await fetch("http://localhost:8080/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
                mode: "cors", // Ensure CORS is enabled
            });

            if (response.ok) {
                console.log("User created successfully");
            } else {
                console.error("Failed to create user");
            }
        } catch (error) {
            console.error("Error creating user:", error);
        }
    };
    const handleAdminDelete = async() =>{

        //call backend: deleteUser
        //TODO- update this to most recent delete in UserController " @DeleteMapping("/deleteUser/{id}")"
        console.log("gonna find someone to delete!");



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
            }
            else{
                console.log("failed to delete user")
            }
        }
        catch (e){
            console.error("Error deleting said user: ",e)
        }


    }
    const handleAdminEdit = async() =>{
        //call backend: updateUser (PATCH) ver
        console.log("gonna find someone to edit!");
        //


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
            }
            else{
                console.log("failed to edit user")
            }


        }catch (e){
            console.error("Error editing user: ", e);
        }


    }



    const isAdmin =true;
    return (

        <ScrollView style={styles.container} contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}>
            {/*<Button title={"debugging for admin"} onPress={handleAdminButton}/>*/}

            {/*<Text style={styles.title}>Create Account {isAdmin && ( <Text style={{ fontSize: 40 }}>👑</Text>)}</Text>*/}
            {/*<Text style={ styles.title}>Edit Profile ⛭</Text>*/}
            {isAdmin && ( <Text style={ styles.title}>👑 Edit Profile as Admin ⛭</Text>)}
            {!isAdmin && ( <Text style={ styles.title}>Edit Profile ⛭</Text>)}
            {/*//TODO edit title to use logged in user Username */}
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
                            //the user should input their password for confirmation
                            style={styles.input}
                            placeholder="Current Password"
                            value={warnPass}
                            onChangeText={(text) => setWarnPass(text)}
                        />
                        <Button
                            title="Cancel"
                            onPress={() => setUserModalVisible(false)}
                        />
                        <Button
                            title={"Confirm"}
                            onPress={handleDelete}
                        />
                    </View>
                </View>
            </Modal>

            {isAdmin &&(
                <View  style={styles.subContainer} >
                    <Text style={ styles.h5} >Admin Settings</Text>
                    {isAdmin && ( <Text style={ styles.title}>👑 Admin Stuff </Text>)}

                    <TouchableOpacity style={styles.adminButton} onPress={handleAdminViewAll}>
                        {/*display all users somehow: new page or somewhere here*/}
                        <Text style={styles.buttonText}>View all users</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.adminButton} >
                        {/*opens a menu: same thing as create account*/}
                        <Text style={styles.buttonText}>Create Users</Text>
                    </TouchableOpacity>

                    <CustomInput placeholder={"Username"} value={userName} onChangeText={setUsername}/>
                    <CustomInput placeholder={"Password"} value={password} onChangeText={setPassword}/>
                    <CustomInput placeholder={"Set Email"} value={email} onChangeText={setEmail}/>

                    <TouchableOpacity style={styles.button} >
                        <Text style={styles.buttonText} onPress={handleAdminCreate}>Create User</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.adminButton}
                        onPress={() => {
                            console.log('delUserId:', delUserId);
                            // TODO fix this condition...
                            if (delUserId !=="") {
                                setAdminModalVisible(true);
                            } else {
                                console.log("Insert User ID to delete");
                            }
                        }}
                    >
                        {/*opens a menu:decide user, delete user*/}
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
                                    value={warnPass}
                                    onChangeText={(text) => setWarnPass(text)}
                                />
                                <Button
                                    title="Cancel"
                                    onPress={() => setAdminModalVisible(false)}
                                />
                                <Button
                                    title={"Confirm"}
                                    onPress={async () => {
                                        //does Admin input the user's password?
                                        if (warnPass === tempPass) {
                                            await handleAdminDelete();
                                            setAdminModalVisible(false);
                                        } else {
                                            console.log("Incorrect password");
                                        }
                                    }}
                                />
                            </View>
                        </View>
                    </Modal>



                    <TouchableOpacity style={styles.adminButton} onPress={handleAdminEdit}>
                        {/*opens a menu: decide user, do same thing as edit profile */}
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
                    <CustomInput placeholder={"Username"} value={editName} onChangeText={setEditName}/>
                    <CustomInput placeholder={"Password"} value={editPass} onChangeText={setEditPass}/>
                    <CustomInput placeholder={"Set Email"} value={editMail} onChangeText={setEditMail}/>
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
});