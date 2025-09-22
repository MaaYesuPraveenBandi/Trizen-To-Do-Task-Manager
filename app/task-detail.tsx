import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export default function TaskDetailScreen() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  
  // Check if we're in edit mode
  const isEditMode = params.editMode === 'true';
  
  // Parse the task data from params
  const task: Task = {
    id: params.id as string,
    title: params.title as string,
    text: params.text as string,
    completed: params.completed === 'true',
    createdAt: new Date(params.createdAt as string),
    priority: params.priority as 'high' | 'medium' | 'low',
    category: params.category as string,
  };

  // State for editing
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.text);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedCategory, setEditedCategory] = useState(task.category);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Load all tasks
      const storedTasks = await AsyncStorage.getItem('todoTasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.map((t: any) => 
          t.id === task.id ? { 
            ...t, 
            title: editedTitle,
            text: editedDescription,
            priority: editedPriority,
            category: editedCategory 
          } : t
        );
        await AsyncStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
      }
      setIsEditing(false);
      router.back();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedTitle(task.title);
    setEditedDescription(task.text);
    setEditedPriority(task.priority);
    setEditedCategory(task.category);
    setIsEditing(false);
  };

  const handleToggleComplete = async () => {
    try {
      // Load all tasks
      const storedTasks = await AsyncStorage.getItem('todoTasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.map((t: any) => 
          t.id === task.id ? { ...t, completed: !task.completed } : t
        );
        await AsyncStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
      }
      router.back();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // Load all tasks
      const storedTasks = await AsyncStorage.getItem('todoTasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.filter((t: any) => t.id !== task.id);
        await AsyncStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
      }
      router.back();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" translucent />
      <BlurView
        style={styles.container}
        intensity={40}
        tint="dark"
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.contentContainer}
            >
              {/* Header with close and action buttons */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                  <Icon source="arrow-left" size={24} color="#ffffff" />
                </TouchableOpacity>
                
                <View style={styles.actionButtons}>
                  {isEditing ? (
                    <>
                      <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                        <Icon source="close" size={24} color="#ef4444" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                        <Icon source="check" size={24} color="#10b981" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                        <Icon source="pencil" size={24} color="#3b82f6" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity onPress={handleToggleComplete} style={styles.headerButton}>
                        <Icon 
                          source={task.completed ? "check-bold" : "check"} 
                          size={24} 
                          color="#3b82f6"
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                        <Icon source="delete" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Title Section - Directly below header */}
              <View style={styles.titleContainer}>
                {isEditing ? (
                  <TextInput
                    style={[styles.titleInputFullWidth, { color: '#ffffff', borderColor: colors.border }]}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    placeholder="Task title..."
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <Text style={[styles.titleFullWidth, { color: '#ffffff' }]}>{task.title}</Text>
                )}
              </View>

              {/* Task Content */}
              <View style={styles.content}>
                {/* Date */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateText}>{formatDate(task.createdAt)}</Text>
                </View>

                {/* Description */}
                <View style={styles.descriptionSection}>
                  <Text style={[styles.descriptionLabel, { color: colors.text }]}>Description</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.descriptionInput, { color: '#ffffff', borderColor: colors.border }]}
                      value={editedDescription}
                      onChangeText={setEditedDescription}
                      multiline
                      numberOfLines={4}
                      placeholder="Enter task description..."
                      placeholderTextColor={colors.textSecondary}
                    />
                  ) : (
                    <View style={styles.descriptionContainer}>
                      <Text style={[styles.description, { color: '#ffffff' }]}>
                        {task.text || 'No description'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Category section with status */}
              {task.category && (
                <View style={styles.categorySection}>
                  <View style={styles.categoryContent}>
                    <View style={styles.categoryLeft}>
                      <Text style={styles.categoryLabel}>Category</Text>
                      <Text style={styles.categoryText}>{task.category}</Text>
                    </View>
                    
                    <View style={styles.categoryRight}>
                      <View style={styles.statusSectionInline}>
                        <View style={[
                          styles.statusCircle, 
                          { backgroundColor: task.completed ? '#10b981' : '#f59e0b' }
                        ]} />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                          {task.completed ? 'Completed' : 'In Progress'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableOpacity>
      </BlurView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 20,
  },
  titleFullWidth: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left',
    paddingVertical: 8,
  },
  titleInputFullWidth: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    paddingVertical: 8,
    width: '100%',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  statusSectionBottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flex: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  statusSectionInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  dateSection: {
    marginBottom: 30,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  descriptionSection: {
    marginBottom: 30,
  },
  descriptionLabel: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionContainer: {
    padding: 4,
    borderRadius: 8,
  },
  editingContainer: {
    marginTop: 8,
  },
  descriptionInput: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    padding: 12,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  categorySection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  categoryLabel: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginLeft: 8,
    flex: 1,
  },
});