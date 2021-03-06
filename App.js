import React, {useState, useEffect} from 'react';
import {View, StyleSheet, FlatList, Alert, Text} from 'react-native';
import {v4 as uuidv4} from 'uuid';
import { registerRootComponent } from 'expo';
import firebase from 'firebase/app'
import '@firebase/firestore';


import Header from './components/Header';
import ListItem from './components/ListItem';
import AddItem from './components/AddItem';

// Remember to remove your credentials before pushing to git
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };


firebase.initializeApp(firebaseConfig);

const dbh = firebase.firestore();

const App = () => {

  const [items, setItems] = useState([])

  useEffect(() => {
    fetchItems();
  }, [])

  const fetchItems = async() => {
    const response = dbh.collection("items");
    const data = await response.get();
    data.docs.forEach(item => {
      setItems(items => [...items,{'id': item.id, 'text': item.data()['text']}]);
    })
  }

  // Flag true if user is currently editing an item
  const [editStatus, editStatusChange] = useState(false);

  // State to capture information about the item being edited
  const [editItemDetail, editItemDetailChange] = useState({
    id: null,
    text: null,
  });

  const [checkedItems, checkedItemChange] = useState([]);

  const deleteItem = id => {
    deleteFirebaseItem(id);
    setItems(prevItems => {
      return prevItems.filter(item => item.id !== id);
    });
  };

  // Submit the users edits to the overall items state
  const saveEditItem = (id, text) => {
    editFirebaseItem(editItemDetail.id, editItemDetail.text);
    setItems(prevItems => {
      return prevItems.map(item =>
        item.id === editItemDetail.id ? {id, text: editItemDetail.text} : item,
      );
    });
    // Flip edit status back to false
    editStatusChange(!editStatus);
  };

  // Event handler to capture users text input as they edit an item
  const handleEditChange = text => {
    editItemDetailChange({id: editItemDetail.id, text});
  };

  const addNewFirebaseItem = (text) => {
    const newItemID = uuidv4()
    dbh.collection("items").doc(newItemID).set({
      text: text,
    });
    setItems(items => [...items, {'id': newItemID, 'text': text}]);
  }

  const deleteFirebaseItem = (id) => {
    dbh.collection("items").doc(id).delete();
  }

  const editFirebaseItem = (id, text) => {
    dbh.collection("items").doc(id).set({
      text: text,
    });
  }

  const addItem = text => {
    if (!text) {
      Alert.alert(
        'No item entered',
        'Please enter an item when adding to your shopping list',
        [
          {
            text: 'Understood',
            style: 'cancel',
          },
        ],
        {cancelable: true},
      );
    } else {
      addNewFirebaseItem(text);
    }
  };

  // capture old items ID and text when user clicks edit
  const editItem = (id, text) => {
    editItemDetailChange({
      id,
      text,
    });
    return editStatusChange(!editStatus);
  };

  const itemChecked = (id, text) => {
    const isChecked = checkedItems.filter(checkedItem => checkedItem.id === id);
    isChecked.length
      ? // remove item from checked items state (uncheck)
        checkedItemChange(prevItems => {
          return [...prevItems.filter(item => item.id !== id)];
        })
      : // Add item to checked items state
        checkedItemChange(prevItems => {
          return [...prevItems.filter(item => item.id !== id), {id, text}];
        });
  };

  return (
    <View style={styles.container}>
      <Header title="Shopping List" />
      <AddItem addItem={addItem} />
      <FlatList
        data={items}
        keyExtractor = {(item, index) => item.id.toString()}
        renderItem={({ item }) => (
          <ListItem
            item={item}
            deleteItem={deleteItem}
            editItem={editItem}
            isEditing={editStatus}
            editItemDetail={editItemDetail}
            saveEditItem={saveEditItem}
            handleEditChange={handleEditChange}
            itemChecked={itemChecked}
            checkedItems={checkedItems}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },
});

registerRootComponent(App);

export default App;
