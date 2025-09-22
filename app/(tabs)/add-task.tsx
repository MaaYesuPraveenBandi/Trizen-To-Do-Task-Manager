import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-paper';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export default function AddTaskScreen() {
  const { colors, isDarkMode } = useTheme();
  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [selectedCategory, setSelectedCategory] = useState('Work');

  const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Education', 'Finance', 'Travel', 'Hobby'];
  const categoryScrollRef = useRef<ScrollView>(null);

  const scrollLeft = () => {
    categoryScrollRef.current?.scrollTo({ x: -100, animated: true });
  };

  const scrollRight = () => {
    categoryScrollRef.current?.scrollTo({ x: 100, animated: true });
  };

  const addTask = async () => {
    if (inputTitle.trim()) {
      try {
        const newTask: Task = {
          id: Date.now().toString(),
          title: inputTitle.trim(),
          text: inputText.trim(),
          completed: false,
          createdAt: new Date(),
          priority: selectedPriority,
          category: selectedCategory,
        };

        const storedTasks = await AsyncStorage.getItem('todoTasks');
        const existingTasks = storedTasks ? JSON.parse(storedTasks) : [];
        const updatedTasks = [...existingTasks, newTask];
        
        await AsyncStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
        
        // Clear form
        setInputTitle('');
        setInputText('');
        setSelectedPriority('medium');
        setSelectedCategory('Work');
        
        Alert.alert('Success', 'Task added successfully!', [
          {
            text: 'View Tasks',
            onPress: () => router.push('/')
          },
          {
            text: 'Add Another',
            style: 'cancel'
          }
        ]);
      } catch (error) {
        console.error('Error adding task:', error);
        Alert.alert('Error', 'Failed to add task. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter a task title.');
    }
  };

  const clearForm = () => {
    setInputTitle('');
    setInputText('');
    setSelectedPriority('medium');
    setSelectedCategory('Work');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Trizen's new task</Text>
        <TouchableOpacity onPress={clearForm} style={styles.clearButton}>
          <Icon source="refresh" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Task Title */}
        <View style={styles.inputSection}>
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
            value={inputTitle}
            onChangeText={setInputTitle}
            placeholder="Enter task title..."
            placeholderTextColor={colors.textSecondary}
            maxLength={100}
          />
        </View>

        {/* Task Description */}
        <View style={[styles.inputSection, styles.descriptionSection]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.descriptionInput, { color: colors.text, borderColor: colors.border }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter task description..."
            placeholderTextColor={colors.textSecondary}
            multiline
            scrollEnabled={true}
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Spacer to push bottom content down */}
        <View style={styles.spacer} />

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Priority Selection */}
          <View style={[styles.inputSection, styles.prioritySection]}>
          <View style={styles.priorityRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['high', 'medium', 'low'].map((priority) => {
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case 'high': return '#ef4444'; // Red
                    case 'medium': return '#f97316'; // Orange
                    case 'low': return '#3b82f6'; // Blue
                    default: return '#3b82f6';
                  }
                };
                
                return (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityColorButton,
                      { 
                        backgroundColor: selectedPriority === priority ? getPriorityColor(priority) : 'transparent',
                        borderColor: getPriorityColor(priority)
                      }
                    ]}
                    onPress={() => setSelectedPriority(priority as 'high' | 'medium' | 'low')}
                  >
                    <Text style={[
                      styles.priorityColorButtonText,
                      { color: selectedPriority === priority ? '#ffffff' : getPriorityColor(priority) }
                    ]}>
                      {priority.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Category Selection */}
        <View style={[styles.inputSection, styles.categoryInputSection]}>
          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.categoryWrapper}>
            {/* Left scroll indicator */}
            <TouchableOpacity style={styles.scrollIndicator} onPress={scrollLeft}>
              <Icon source="chevron-left" size={16} color="#64748b" />
            </TouchableOpacity>
            
            <ScrollView 
              ref={categoryScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScrollView}
            >
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === category && styles.categoryButtonTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {/* Right scroll indicator */}
            <TouchableOpacity style={styles.scrollIndicator} onPress={scrollRight}>
              <Icon source="chevron-right" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity onPress={clearForm} style={styles.secondaryButton}>
            <Icon source="close" size={20} color="#64748b" />
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={addTask} style={styles.primaryButton}>
            <Icon source="plus" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    fontSize: 18,
    padding: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  descriptionInput: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    fontSize: 16,
    padding: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    height: 140,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityColorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityColorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryScrollView: {
    flex: 1,
    paddingHorizontal: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  descriptionSection: {
    minHeight: 160,
  },
  prioritySection: {
    marginTop: 35,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 50,
  },
  bottomSection: {
    marginTop: 'auto',
  },
  categoryInputSection: {
    marginBottom: 8,
    marginTop: -8,
  },
  categoryWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollIndicator: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
});