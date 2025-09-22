import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from 'react-native-paper';

interface Task {
  id: string;
  title: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export default function CompletedTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 1000); // Refresh every second
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('todoTasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
        }));
        setTasks(parsedTasks.filter((task: Task) => task.completed));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const deleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this completed task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedTasks = await AsyncStorage.getItem('todoTasks');
              if (storedTasks) {
                const allTasks = JSON.parse(storedTasks);
                const updatedTasks = allTasks.filter((task: Task) => task.id !== taskId);
                await AsyncStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
                loadTasks();
              }
            } catch (error) {
              console.error('Error deleting task:', error);
            }
          },
        },
      ]
    );
  };

  const markAsIncomplete = async (taskId: string) => {
    try {
      const storedTasks = await AsyncStorage.getItem('todoTasks');
      if (storedTasks) {
        const allTasks = JSON.parse(storedTasks);
        const updatedTasks = allTasks.map((task: Task) =>
          task.id === taskId ? { ...task, completed: false } : task
        );
        await AsyncStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
        loadTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskContainer}>
      <View style={styles.taskContent}>
        <View style={[styles.checkbox, styles.checkboxCompleted]}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        
        <View style={styles.taskTextContainer}>
          <Text style={[styles.taskTitle, styles.taskTextCompleted]}>
            {item.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
            <Text style={styles.dateText}>
              {item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.undoButton}
          onPress={() => markAsIncomplete(item.id)}
        >
          <Icon source="undo" size={20} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteTask(item.id)}
        >
          <Icon source="delete" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#34393b" barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Completed Tasks</Text>
        <Text style={styles.statsText}>
          {tasks.length} completed task{tasks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        style={styles.tasksList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              🎯 No completed tasks yet!{'\n'}
              Complete some tasks to see them here.
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
    backgroundColor: '#1e293b', // Trizen theme background
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#94a3b8', // Trizen theme text
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskContainer: {
    backgroundColor: '#334155', // Trizen theme container
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981', // Green for completed
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
    borderColor: '#10b981', // Green for completed
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#10b981', // Green for completed
    borderColor: '#10b981',
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
  taskTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
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
    flexWrap: 'wrap',
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
  categoryText: {
    color: '#a8adb3',
    fontSize: 12,
  },
  dateText: {
    color: '#7c8287',
    fontSize: 11,
    fontStyle: 'italic',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  undoButton: {
    padding: 8,
  },
  undoButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#a8adb3',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
