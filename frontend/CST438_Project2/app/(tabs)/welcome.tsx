import { StyleSheet, Image, Platform, View, TextInput, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FunctionComponent, useEffect } from 'react';
import React from 'react';
import {useState} from "react";
import TierList from '@/app/TierList';

const API_BASE_URL = 'http://localhost:8080/api';

const mainTier: React.FC = () => {
  const [tierItem, setTierItem] = useState("");
  const [selectedTier, setSelectedTier] = useState("Splus");
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
    console.log("handleSubmit");
    if (tierItem.trim() && selectedTier) {
      // Use the selectedTier directly without conversion
      const tier = selectedTier as keyof typeof tierListProps;
      
      // Create a new state object with the added item
      setTierListProps(prev => ({
        ...prev,
        [tier]: [...(prev[tier] || []), tierItem]
      }));
      
      // Add item to API
      addItemToTier(selectedTier, tierItem)
        .then(() => console.log(`Added ${tierItem} to ${selectedTier}`))
        .catch(err => console.error(`Failed to add item to API: ${err}`));
      
      // Reset the input field
      setTierItem("");
    }
  };

  useEffect(() => {
    createTestUser();
    createTiersInAPI();
  }, []);
  
  // Function to create tiers in the API with proper ranks
  const createTiersInAPI = async () => {
    try {
      const userId = 1; 
      
      // First, check if the user exists
      const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (!userResponse.ok) {
        console.error(`User with ID ${userId} doesn't exist. Creating user first.`);
        // Create a user if needed
        const createUserResponse = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: "defaultUser",
            email: "default@example.com",
            // Add any other required user fields
          }),
        });
        
        if (!createUserResponse.ok) {
          console.error("Failed to create user:", await createUserResponse.text());
          return;
        }
      }
      
      // Now create tiers
      for (let i = 0; i < tiers.length; i++) {
        const tierName = tiers[i];
        
        // Check if tier already exists before creating
        const searchResponse = await fetch(`${API_BASE_URL}/tiers/search?name=${encodeURIComponent(tierName)}`);
        const existingTiers = await searchResponse.json();
        
        if (existingTiers && existingTiers.length === 0) {
          // Tier doesn't exist, create it
          console.log(`Trying to create tier: ${tierName} with rank ${i}`);
          
          const createResponse = await fetch(`${API_BASE_URL}/tiers/user/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: tierName,
              rank: i,
              description: `${tierName} tier items`
            }),
          });
          
          const responseText = await createResponse.text();
          
          if (createResponse.ok) {
            console.log(`Successfully created tier: ${tierName} with rank ${i}`);
          } else {
            console.error(`Failed to create tier ${tierName}:`, responseText);
          }
        } else {
          console.log(`Tier ${tierName} already exists or search failed`);
        }
      }
    } catch (error) {
      console.error("Error creating tiers:", error);
    }
  };
  const createTestUser = async () => {
    try {
      // Include all required fields
      const userPayload = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",  // Required with min 6 characters
        isAdmin: false           // Required boolean field
      };
      
      console.log("Creating user with payload:", userPayload);
      
      const createUserResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPayload),
      });
      
      if (createUserResponse.ok) {
        const user = await createUserResponse.json();
        console.log("Successfully created test user:", user);
        return user.id;
      } else {
        const errorStatus = createUserResponse.status;
        let errorText;
        
        try {
          errorText = await createUserResponse.json();
          console.error(`Failed to create user (${errorStatus}):`, errorText);
        } catch (e) {
          errorText = await createUserResponse.text();
          console.error(`Failed to create user (${errorStatus}):`, errorText);
        }
        
        return null;
      }
    } catch (error) {
      console.error("Error creating test user:", error);
      return null;
    }
  };
  // Function to add an item to a specific tier
  const addItemToTier = async (tierName: string, itemName: string) => {
    try {
      // First get the tier ID - use consistent naming
      const searchResponse = await fetch(`${API_BASE_URL}/tiers/search?name=${encodeURIComponent(tierName)}`);
      const searchResults = await searchResponse.json();
      
      if (searchResults.length > 0) {
        const tierId = searchResults[0].id;
        
        // Create the item and assign to tier
        const createItemResponse = await fetch(`${API_BASE_URL}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: itemName,
            description: `Item in ${tierName} tier`,
            tier: {
              id: tierId
            }
          }),
        });
        
        if (createItemResponse.ok) {
          console.log(`Added item: ${itemName} to tier: ${tierName}`);
        } else {
          const errorText = await createItemResponse.text();
          console.error(`Failed to add item to tier ${tierName}:`, errorText);
        }
      }
    } catch (error) {
      console.error(`Error adding item to tier ${tierName}:`, error);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.tierContainer}>
        <TierList {...tierListProps} />
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTier}
          onValueChange={(itemValue) => setSelectedTier(itemValue)}
          style={styles.picker}
        >
          {tiers.map((tier) => (
            <Picker.Item key={tier} label={tier === 'Splus' ? 'S+' : tier} value={tier} />
          ))}
        </Picker>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter Item"
        placeholderTextColor="#aaa"
        onChangeText={(text) => setTierItem(text)}
        value={tierItem}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

export default mainTier;

const styles = StyleSheet.create({
  background:{
    backgroundColor:"#f0f0f0",
    width:'100%',
    height:'100%',
    justifyContent:'center',
    alignItems: 'center',
    padding: 20,
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
    width: "90%",
    height: "60%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "white",
  },
  input: {
    width: "80%",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "white",
  },
  pickerContainer:{
    width: '80%',
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "white",
    overflow: 'hidden',
  },
  picker:{
    width:'100%',
    height:'100%',
  },
});