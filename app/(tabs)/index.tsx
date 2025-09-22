import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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

export default function TodoScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const params = useLocalSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [selectedCategory, setSelectedCategory] = useState('Work');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'pending'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'high' | 'medium' | 'low' | null>(null);
  const [showInput, setShowInput] = useState(false);

  // Handle edit mode from navigation params
  useEffect(() => {
    if (params.editTaskId) {
      const taskToEdit = tasks.find(task => task.id === params.editTaskId);
      if (taskToEdit) {
        setEditingTask(taskToEdit);
        setInputTitle(params.editTaskTitle as string || taskToEdit.title);
        setInputText(params.editTaskText as string || taskToEdit.text);
        setSelectedPriority(params.editTaskPriority as 'high' | 'medium' | 'low' || taskToEdit.priority);
        setSelectedCategory(params.editTaskCategory as string || taskToEdit.category);
        setShowInput(true);
        
        // Clear the params
        router.replace('/');
      }
    }
  }, [params.editTaskId, tasks]);

  // Load tasks from AsyncStorage on app start and whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  // Save tasks to AsyncStorage whenever tasks change
  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('todoTasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          title: task.title || 'Untitled', // Add default title for existing tasks
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        }));
        setTasks(parsedTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('todoTasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const addTask = () => {
    if (inputTitle.trim() === '' || inputText.trim() === '') {
      Alert.alert('Error', 'Please enter both title and description');
      return;
    }

    if (editingTask) {
      // Update existing task
      setTasks(tasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, title: inputTitle.trim(), text: inputText.trim(), priority: selectedPriority, category: selectedCategory }
          : task
      ));
      setEditingTask(null);
    } else {
      // Add new task
      const newTask: Task = {
        id: Date.now().toString(),
        title: inputTitle.trim(),
        text: inputText.trim(),
        completed: false,
        createdAt: new Date(),
        priority: selectedPriority,
        category: selectedCategory,
      };
      setTasks([newTask, ...tasks]);
    }
    
    setInputTitle('');
    setInputText('');
    setSelectedPriority('medium');
    setSelectedCategory('Work');
    setShowInput(false); // Hide input after adding task
  };

  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setTasks(tasks.filter(task => task.id !== taskId)),
        },
      ]
    );
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const editTask = (task: Task) => {
    // Navigate to task details page for editing
    router.push({
      pathname: '/task-detail',
      params: {
        id: task.id,
        title: task.title,
        text: task.text,
        completed: task.completed.toString(),
        priority: task.priority,
        category: task.category,
        createdAt: task.createdAt.toISOString(),
        editMode: 'true', // Flag to indicate edit mode
      },
    });
  };

  const cancelEdit = () => {
    setInputTitle('');
    setInputText('');
    setSelectedPriority('medium');
    setSelectedCategory('Work');
    setEditingTask(null);
    setShowInput(false); // Hide input when canceling edit
  };

  const openTaskDetail = (task: Task) => {
    router.push({
      pathname: '/task-detail',
      params: {
        id: task.id,
        title: task.title,
        text: task.text,
        completed: task.completed.toString(),
        createdAt: task.createdAt.toISOString(),
        priority: task.priority,
        category: task.category,
      },
    });
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    // Apply main filter (all/pending)
    if (filterType === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    }
    
    // Apply priority filter if selected
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
      // If priority filter is applied with pending filter, also filter out completed tasks
      if (filterType === 'pending') {
        filtered = filtered.filter(task => !task.completed);
      }
    }
    
    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskContainer}>
      <View style={styles.taskContent}>
        <TouchableOpacity
          style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
          onPress={() => toggleTaskComplete(item.id)}
        >
          {item.completed && (
            <Icon source="check" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.taskTextContainer}
          onPress={() => openTaskDetail(item)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.taskTitle,
            item.completed && styles.taskTextCompleted
          ]}>
            {item.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
            <Text style={styles.taskDate}>
              {item.createdAt instanceof Date && !isNaN(item.createdAt.getTime()) 
                ? `${item.createdAt.toLocaleDateString()} at ${item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Invalid date'
              }
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editTask(item)}
        >
          <Icon source="pencil" size={20} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteTask(item.id)}
        >
          <Icon source="delete" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredTasks = getFilteredTasks();
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.surface} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.surface,
          borderBottomLeftRadius: isDarkMode ? 8 : 0,
          borderBottomRightRadius: isDarkMode ? 8 : 0,
        }
      ]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/headerLogo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Trizen</Text>
          </View>
          <TouchableOpacity 
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <Icon 
              source={isDarkMode ? "weather-sunny" : "weather-night"} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={[styles.filterRow, { marginTop: 6 }]}>
        {/* All/Pending Filters - Left Side */}
        <View style={styles.leftFilters}>
          {(['all', 'pending'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                filterType === filter && styles.filterButtonActive
              ]}
              onPress={() => setFilterType(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                filterType === filter && styles.filterButtonTextActive
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Priority Filters - Right Side (only show when All or Pending is selected) */}
        {(filterType === 'all' || filterType === 'pending') && (
          <View style={styles.rightFilters}>
            {(['high', 'medium', 'low'] as const).map(priority => {
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
                      backgroundColor: priorityFilter === priority ? getPriorityColor(priority) : 'transparent',
                      borderColor: getPriorityColor(priority)
                    }
                  ]}
                  onPress={() => setPriorityFilter(priorityFilter === priority ? null : priority)}
                >
                  <Text style={[
                    styles.priorityColorButtonText,
                    { color: priorityFilter === priority ? '#ffffff' : getPriorityColor(priority) }
                  ]}>
                    {priority.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Edit Task Input - Show only when editing */}
      {showInput && editingTask && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Edit title..."
            placeholderTextColor="#8e9297"
            value={inputTitle}
            onChangeText={setInputTitle}
            autoFocus={true}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Edit description..."
            placeholderTextColor="#8e9297"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          {/* Priority Selection */}
          <View style={styles.priorityContainer}>
            <Text style={styles.priorityLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {(['high', 'medium', 'low'] as const).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    selectedPriority === priority && styles.priorityButtonActive
                  ]}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    selectedPriority === priority && styles.priorityButtonTextActive
                  ]}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.priorityContainer}>
            <Text style={styles.priorityLabel}>Category</Text>
            <View style={styles.priorityButtons}>
              {(['Work', 'Personal', 'Shopping', 'Health'] as const).map(category => (
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
          </View>
          
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Text style={styles.addButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.tasksList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filterType === 'all' ? 'No tasks yet! Go to Add Task tab to create one.' :
               filterType === 'pending' ? 'No pending tasks!' :
               'No ' + filterType + ' priority tasks!'}
            </Text>
          </View>
        }
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Will be set dynamically
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsContainer: {
    marginTop: 0,
  },
  statsText: {
    fontSize: 13,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    justifyContent: 'center',
  },
  priorityFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftFilters: {
    flexDirection: 'row',
  },
  rightFilters: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6', // Trizen blue
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6', // Trizen blue
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#3b82f6', // Trizen blue
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  priorityButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 3,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    minWidth: 32,
  },
  priorityColorButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityColorButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  priorityButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 15,
    borderWidth: 0,
  },
  textInput: {
    color: '#ffffff',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#64748b',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#64748b', // Gray for cancel
  },
  cancelButtonText: {
    color: '#94a3b8', // Lighter gray text
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#3b82f6', // Trizen blue
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskContainer: {
    backgroundColor: '#334155', // Darker blue-gray for tasks
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6', // Trizen blue accent
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6', // Trizen blue
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#3b82f6', // Trizen blue for completed
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    color: '#cbd5e1', // Lighter text for better readability
    fontSize: 16,
    lineHeight: 22,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748b', // Muted color for completed tasks
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskDate: {
    color: '#94a3b8', // Muted color for date/time
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#3b82f6', // Trizen blue for edit
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ef4444', // Red for delete
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#94a3b8', // Consistent muted text
    fontSize: 16,
    textAlign: 'center',
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  filterLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 10,
    alignSelf: 'center',
  },
  priorityFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    marginHorizontal: 4,
  },
  priorityContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  priorityLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  // Category button styles
  categoryButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginHorizontal: 2,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
});
