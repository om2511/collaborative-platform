import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { whiteboardService } from '../../services/whiteboardService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  PencilIcon,
  Square3Stack3DIcon,
  CircleStackIcon,
  CursorArrowRaysIcon,
  PaintBrushIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const CollaborativeWhiteboard = ({ projectId, whiteboardId, isReadOnly = false }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const stageRef = useRef();
  const [whiteboard, setWhiteboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tool, setTool] = useState('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [objects, setObjects] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState(whiteboardId);
  const [pendingObjects, setPendingObjects] = useState(new Set()); // Track objects being created
  const [queuedUpdates, setQueuedUpdates] = useState(new Map()); // Queue updates for pending objects
  const [isOffline, setIsOffline] = useState(true); // Start in offline mode until server is confirmed
  const [hasTriedServer, setHasTriedServer] = useState(false); // Track if we've attempted server connection

  const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#880088'
  ];

  // Utility function to handle server operations safely
  const tryServerOperation = async (operation, fallback = null) => {
    if (isOffline) {
      return fallback;
    }
    
    try {
      const result = await operation();
      setIsOffline(false);
      return result;
    } catch (error) {
      if (!hasTriedServer) {
        setHasTriedServer(true);
      }
      setIsOffline(true);
      return fallback;
    }
  };

  useEffect(() => {
    if (projectId || whiteboardId) {
      loadWhiteboard();
    }
  }, [projectId, whiteboardId]);

  // Periodic cleanup of duplicate objects
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setObjects(prev => {
        const deduplicated = deduplicateObjects(prev);
        if (deduplicated.length !== prev.length) {
        }
        return deduplicated.length !== prev.length ? deduplicated : prev;
      });
    }, 5000); // Clean up every 5 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  // Check server connectivity on load
  useEffect(() => {
    const checkServerConnectivity = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
        setHasTriedServer(true);
      } catch (error) {
        setIsOffline(true);
        setHasTriedServer(true);
      }
    };

    checkServerConnectivity();
  }, []);

  // Socket event listeners for real-time collaboration
  useEffect(() => {
    if (socket && currentWhiteboardId) {
      socket.on('whiteboard_object_added', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects(prev => {
            // Check if object already exists to prevent duplicates
            const exists = prev.some(obj => obj.id === data.object.id);
            if (exists) {
              console.warn('Received duplicate object from socket:', data.object.id);
              return prev;
            }
            return [...prev, data.object];
          });
        }
      });

      socket.on('whiteboard_object_updated', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects(prev => prev.map(obj => 
            obj.id === data.objectId 
              ? { ...obj, ...data.updates }
              : obj
          ));
        }
      });

      socket.on('whiteboard_object_deleted', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects(prev => prev.filter(obj => obj.id !== data.objectId));
        }
      });

      socket.on('cursor_updated', (data) => {
        if (data.whiteboardId === currentWhiteboardId && data.userId !== user._id) {
          setCollaborators(prev => {
            const updated = prev.filter(c => c.userId !== data.userId);
            return [...updated, {
              userId: data.userId,
              userName: data.userName,
              cursor: data.cursor
            }];
          });
        }
      });

      socket.on('whiteboard_cleared', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects([]);
        }
      });

      return () => {
        socket.off('whiteboard_object_added');
        socket.off('whiteboard_object_updated');
        socket.off('whiteboard_object_deleted');
        socket.off('cursor_updated');
        socket.off('whiteboard_cleared');
      };
    }
  }, [socket, currentWhiteboardId, user._id]);

  const loadWhiteboard = async () => {
    try {
      setIsLoading(true);
      
      let whiteboardData;
      
      if (whiteboardId) {
        // Load specific whiteboard by ID
        try {
          const response = await whiteboardService.getWhiteboard(whiteboardId);
          whiteboardData = response.data.whiteboard;
          setCurrentWhiteboardId(whiteboardId);
          setIsOffline(false);
          setHasTriedServer(true);
        } catch (error) {
          console.warn('Could not load whiteboard from server, working offline');
          setIsOffline(true);
          setHasTriedServer(true);
          // Create a temporary offline whiteboard
          whiteboardData = {
            _id: whiteboardId,
            name: 'Offline Whiteboard',
            canvas: { objects: [], background: { color: '#ffffff' } },
            collaborators: []
          };
          setCurrentWhiteboardId(whiteboardId);
        }
      } else if (projectId) {
        // Get or create whiteboard for project
        try {
          const response = await whiteboardService.getProjectWhiteboards(projectId);
          const whiteboards = response.data.whiteboards;
          
          if (whiteboards && whiteboards.length > 0) {
            // Use the first (most recent) whiteboard
            whiteboardData = whiteboards[0];
            setCurrentWhiteboardId(whiteboardData._id);
          } else {
            // Create a new whiteboard for the project
            const createResponse = await whiteboardService.createWhiteboard(projectId, {
              name: 'Project Whiteboard',
              canvas: {
                objects: [],
                background: { color: '#ffffff' }
              }
            });
            whiteboardData = createResponse.data.whiteboard;
            setCurrentWhiteboardId(whiteboardData._id);
          }
          setIsOffline(false);
          setHasTriedServer(true);
        } catch (error) {
          console.warn('Could not connect to server, working offline');
          setIsOffline(true);
          setHasTriedServer(true);
          // Create a temporary offline whiteboard
          const offlineId = `offline_${Date.now()}`;
          whiteboardData = {
            _id: offlineId,
            name: 'Offline Whiteboard',
            project: projectId,
            canvas: { objects: [], background: { color: '#ffffff' } },
            collaborators: []
          };
          setCurrentWhiteboardId(offlineId);
        }
      }
      
      if (whiteboardData) {
        setWhiteboard(whiteboardData);
        // Deduplicate objects when loading from backend
        const loadedObjects = deduplicateObjects(whiteboardData.canvas?.objects || []);
        setObjects(loadedObjects);
        setCollaborators(whiteboardData.collaborators || []);
      }
    } catch (error) {
      console.error('Error loading whiteboard:', error);
      setIsOffline(true);
      toast.error('Working in offline mode');
    } finally {
      setIsLoading(false);
    }
  };

  // Improved unique ID generation
  const generateUniqueId = (prefix) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = Math.floor(Math.random() * 10000);
    const userId = user._id ? user._id.slice(-4) : 'anon';
    return `${prefix}_${timestamp}_${counter}_${random}_${userId}`;
  };

  // Deduplicate objects array to prevent rendering issues
  const deduplicateObjects = (objectsArray) => {
    const seen = new Set();
    return objectsArray.filter(obj => {
      if (!obj.id) {
        obj.id = generateUniqueId(`${obj.type || 'object'}_recovered`);
      }
      if (seen.has(obj.id)) {
        console.warn('Removing duplicate object:', obj.id);
        return false;
      }
      seen.add(obj.id);
      return true;
    });
  };

  const handleMouseDown = (e) => {
    if (isReadOnly) return;

    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);

    if (tool === 'pen') {
      setCurrentPath([pos.x, pos.y]);
    } else if (tool === 'rectangle') {
      const rect = {
        id: generateUniqueId('rect'),
        type: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth
      };
      // Add object locally first for immediate feedback
      setObjects(prev => [...prev, rect]);
      setSelectedObjectId(rect.id); // Track the object being drawn
    } else if (tool === 'circle') {
      const circle = {
        id: generateUniqueId('circle'),
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth
      };
      // Add object locally first for immediate feedback
      setObjects(prev => [...prev, circle]);
      setSelectedObjectId(circle.id); // Track the object being drawn
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const textObj = {
          id: generateUniqueId('text'),
          type: 'text',
          x: pos.x,
          y: pos.y,
          text,
          fontSize: 16,
          fontFamily: 'Arial',
          fill: color
        };
        addObject(textObj);
      }
    } else if (tool === 'sticky_note') {
      const text = prompt('Enter note text:');
      if (text) {
        const note = {
          id: generateUniqueId('note'),
          type: 'sticky_note',
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 100,
          text,
          fill: '#fff2cc',
          stroke: '#d6b656',
          strokeWidth: 1
        };
        addObject(note);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || isReadOnly) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    // Update cursor position for collaborators
    if (socket) {
      socket.emit('cursor_move', {
        projectId: whiteboard?.project,
        whiteboardId: currentWhiteboardId,
        x: point.x,
        y: point.y
      });
    }

    if (tool === 'pen') {
      setCurrentPath(prev => [...prev, point.x, point.y]);
    } else if (tool === 'rectangle' && selectedObjectId) {
      // Update only the selected object locally during drawing
      setObjects(prev => prev.map(obj => {
        if (obj.id === selectedObjectId && obj.type === 'rectangle') {
          const width = point.x - obj.x;
          const height = point.y - obj.y;
          return { ...obj, width, height };
        }
        return obj;
      }));
    } else if (tool === 'circle' && selectedObjectId) {
      // Update only the selected object locally during drawing
      setObjects(prev => prev.map(obj => {
        if (obj.id === selectedObjectId && obj.type === 'circle') {
          const radius = Math.sqrt(
            Math.pow(point.x - obj.x, 2) + Math.pow(point.y - obj.y, 2)
          );
          return { ...obj, radius };
        }
        return obj;
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || isReadOnly) return;

    if (tool === 'pen' && currentPath.length > 2) {
      const line = {
        id: generateUniqueId('line'),
        type: 'line',
        points: currentPath,
        stroke: color,
        strokeWidth,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      };
      addObject(line);
    } else if ((tool === 'rectangle' || tool === 'circle') && selectedObjectId) {
      // Find the object that was being drawn and save it to backend
      const drawnObject = objects.find(obj => obj.id === selectedObjectId);
      if (drawnObject) {
        // Only save if the object has meaningful dimensions
        if ((drawnObject.type === 'rectangle' && (Math.abs(drawnObject.width) > 5 || Math.abs(drawnObject.height) > 5)) ||
            (drawnObject.type === 'circle' && drawnObject.radius > 5)) {
          saveObjectToBackend(drawnObject);
        } else {
          // Remove object if too small
          setObjects(prev => prev.filter(obj => obj.id !== selectedObjectId));
        }
      }
      setSelectedObjectId(null);
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const addObject = async (objectData) => {
    try {
      // Check if object already exists to prevent duplicates
      setObjects(prev => {
        const exists = prev.some(obj => obj.id === objectData.id);
        if (exists) {
          console.warn('Object with ID already exists:', objectData.id);
          return prev;
        }
        return [...prev, objectData];
      });
      
      // Save to backend immediately
      await saveObjectToBackend(objectData);
    } catch (error) {
      console.error('Error adding object:', error);
      toast.error('Failed to add object');
      
      // Remove failed object from local state
      setObjects(prev => prev.filter(obj => obj.id !== objectData.id));
    }
  };

  const saveObjectToBackend = async (objectData) => {
    try {
      // Mark object as pending
      setPendingObjects(prev => new Set([...prev, objectData.id]));
      
      if (socket) {
        socket.emit('whiteboard_update', {
          projectId: whiteboard?.project,
          action: 'add',
          object: objectData
        });
      }

      // Save to backend using safe server operation
      await tryServerOperation(
        () => whiteboardService.addObject(currentWhiteboardId, objectData),
        null // fallback - do nothing if offline
      );
      
      // Remove from pending once processed (whether online or offline)
      setPendingObjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(objectData.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error saving object to backend:', error);
      // Don't remove from local state if backend save fails in offline mode
      setPendingObjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(objectData.id);
        return newSet;
      });
    }
  };

  const updateObject = async (objectId, updates) => {
    try {
      // Update object locally first
      setObjects(prev => prev.map(obj => 
        obj.id === objectId ? { ...obj, ...updates } : obj
      ));

      if (socket) {
        socket.emit('whiteboard_update', {
          projectId: whiteboard?.project,
          action: 'update',
          object: { id: objectId, ...updates }
        });
      }

      // Save to backend using safe server operation
      await tryServerOperation(
        () => whiteboardService.updateObject(currentWhiteboardId, objectId, updates),
        null // fallback - do nothing if offline
      );
    } catch (error) {
      console.error('Error updating object:', error);
      // Only log the error, don't revert the local change as it might be an offline scenario
    }
  };

  const deleteObject = async (objectId) => {
    try {
      setObjects(prev => prev.filter(obj => obj.id !== objectId));

      if (socket) {
        socket.emit('whiteboard_update', {
          projectId: whiteboard.project,
          action: 'delete',
          object: { id: objectId }
        });
      }

      // Save to backend
      await whiteboardService.deleteObject(currentWhiteboardId, objectId);
    } catch (error) {
      console.error('Error deleting object:', error);
      toast.error('Failed to delete object');
    }
  };

  const clearCanvas = async () => {
    if (window.confirm('Are you sure you want to clear the entire whiteboard?')) {
      try {
        // Clear locally first
        setObjects([]);
        
        if (socket) {
          socket.emit('whiteboard_update', {
            projectId: whiteboard?.project,
            action: 'clear',
            whiteboardId: currentWhiteboardId
          });
        }

        // Clear on backend using dedicated clear endpoint
        await tryServerOperation(
          () => whiteboardService.clearWhiteboard(currentWhiteboardId),
          null // fallback - do nothing if offline
        );
        
        toast.success('Whiteboard cleared');
      } catch (error) {
        console.error('Error clearing whiteboard:', error);
        toast.error('Failed to clear whiteboard');
      }
    }
  };

  const renderObject = (obj, index) => {
    // Ensure object has an ID for React key - generate one if missing
    if (!obj.id) {
      obj.id = generateUniqueId(`${obj.type || 'object'}_recovered`);
    }
    const objectId = obj.id;
    
    const commonProps = {
      id: objectId,
      draggable: !isReadOnly,
      onClick: () => setSelectedObjectId(objectId),
      onDragEnd: (e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        
        // Update object position
        updateObject(objectId, {
          x: newX,
          y: newY
        });
      }
    };

    switch (obj.type) {
      case 'rectangle':
        return (
          <Rect
            key={objectId}
            {...commonProps}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        );
      case 'circle':
        return (
          <Circle
            key={objectId}
            {...commonProps}
            x={obj.x}
            y={obj.y}
            radius={obj.radius}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        );
      case 'line':
        return (
          <Line
            key={objectId}
            {...commonProps}
            points={obj.points}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            tension={obj.tension || 0.5}
            lineCap={obj.lineCap || 'round'}
            lineJoin={obj.lineJoin || 'round'}
          />
        );
      case 'text':
        return (
          <Text
            key={objectId}
            {...commonProps}
            x={obj.x}
            y={obj.y}
            text={obj.text}
            fontSize={obj.fontSize}
            fontFamily={obj.fontFamily}
            fill={obj.fill}
          />
        );
      case 'sticky_note':
        return (
          <Group key={objectId} {...commonProps}>
            <Rect
              x={obj.x}
              y={obj.y}
              width={obj.width}
              height={obj.height}
              fill={obj.fill}
              stroke={obj.stroke}
              strokeWidth={obj.strokeWidth}
              cornerRadius={4}
            />
            <Text
              x={obj.x + 10}
              y={obj.y + 10}
              text={obj.text}
              fontSize={12}
              fontFamily="Arial"
              fill="#333"
              width={obj.width - 20}
              height={obj.height - 20}
              verticalAlign="top"
            />
          </Group>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="flex flex-col items-center justify-center h-96 relative">
          <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
            <PaintBrushIcon className="h-12 w-12 text-indigo-600" />
          </div>
          <LoadingSpinner size="xl" className="mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Whiteboard</h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Setting up your collaborative drawing canvas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
      
      {/* Toolbar */}
      {!isReadOnly && (
        <div className="border-b border-white/30 p-6 backdrop-blur-sm relative">
          <div className="flex flex-wrap items-center gap-6">
            {/* Tools */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-700 flex items-center">
                <PaintBrushIcon className="h-4 w-4 mr-2 text-indigo-600" />
                Tools:
              </span>
              <div className="flex space-x-2">
                {[
                  { id: 'pen', icon: PencilIcon, label: 'Pen' },
                  { id: 'rectangle', icon: Square3Stack3DIcon, label: 'Rectangle' },
                  { id: 'circle', icon: CircleStackIcon, label: 'Circle' },
                  { id: 'text', icon: CursorArrowRaysIcon, label: 'Text' },
                  { id: 'sticky_note', icon: DocumentIcon, label: 'Sticky Note' }
                ].map((toolItem) => {
                  const Icon = toolItem.icon;
                  return (
                    <button
                      key={toolItem.id}
                      onClick={() => setTool(toolItem.id)}
                      className={`p-3 rounded-xl transition-all duration-200 backdrop-blur-sm border shadow-sm ${
                        tool === toolItem.id
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-300 shadow-lg shadow-indigo-500/25'
                          : 'text-gray-600 hover:text-gray-800 bg-white/50 hover:bg-white/70 border-gray-200/50'
                      }`}
                      title={toolItem.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-700">Color:</span>
              <div className="flex space-x-2 p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
                {colors.map((colorOption) => (
                  <button
                    key={colorOption}
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-200 hover:scale-110 ${
                      color === colorOption ? 'border-gray-800 shadow-lg' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption }}
                    title={`Color: ${colorOption}`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-700">Size:</span>
              <div className="flex items-center space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(strokeWidth-1)/19*100}%, #e5e7eb ${(strokeWidth-1)/19*100}%, #e5e7eb 100%)`
                  }}
                />
                <span className="text-sm font-medium text-gray-600 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-200/50 min-w-[45px] text-center">{strokeWidth}px</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 ml-auto">
              {selectedObjectId && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={TrashIcon}
                  iconPosition="left"
                  onClick={() => deleteObject(selectedObjectId)}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
                >
                  Delete Selected
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                icon={TrashIcon}
                iconPosition="left"
                onClick={clearCanvas}
                className="bg-white/50 border-gray-200/50 backdrop-blur-sm hover:bg-white/70 text-gray-700 hover:text-gray-900 shadow-sm transition-all duration-200"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative bg-gradient-to-br from-gray-50/50 to-white/30 backdrop-blur-sm">
        <div className="relative border border-white/30 rounded-xl m-4 overflow-hidden shadow-inner bg-white/30 backdrop-blur-sm">
          <Stage
            width={window.innerWidth - 140}
            height={600}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            ref={stageRef}
            className="rounded-xl"
          >
            <Layer>
              {/* Render all objects - deduplicate before rendering */}
              {deduplicateObjects(objects).map((obj, index) => renderObject(obj, index))}

              {/* Render current drawing path */}
              {isDrawing && tool === 'pen' && currentPath.length > 2 && (
                <Line
                  key="temp-drawing-path"
                  points={currentPath}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation="source-over"
                  opacity={0.8}
                />
              )}

              {/* Render collaborator cursors with enhanced styling */}
              {collaborators.map((collaborator, index) => (
                <Group key={collaborator.userId || collaborator.user?._id || `collaborator-${index}`}>
                  <Circle
                    x={collaborator.cursor.x}
                    y={collaborator.cursor.y}
                    radius={6}
                    fill={collaborator.cursor.color || '#6366f1'}
                    stroke="#ffffff"
                    strokeWidth={2}
                    shadowBlur={8}
                    shadowColor={collaborator.cursor.color || '#6366f1'}
                    shadowOpacity={0.3}
                  />
                  <Text
                    x={collaborator.cursor.x + 12}
                    y={collaborator.cursor.y - 25}
                    text={collaborator.userName || collaborator.user?.name || 'Anonymous'}
                    fontSize={12}
                    fill="#1f2937"
                    fontStyle="bold"
                    padding={4}
                    cornerRadius={6}
                    fillAfterStrokeEnabled={true}
                    strokeWidth={0}
                  />
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Status Indicators */}
        <div className="absolute top-6 right-6 space-y-3 z-10">
          {/* Offline Indicator */}
          {isOffline && (
            <div className="bg-yellow-100/80 backdrop-blur-xl border border-yellow-200/50 text-yellow-800 px-4 py-3 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-sm font-semibold">Working Offline</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">Drawing saved locally</p>
            </div>
          )}
          
          {/* Online Indicator */}
          {!isOffline && hasTriedServer && (
            <div className="bg-green-100/80 backdrop-blur-xl border border-green-200/50 text-green-800 px-4 py-3 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                <span className="text-sm font-semibold">Connected</span>
              </div>
              <p className="text-xs text-green-700 mt-1">Real-time collaboration active</p>
            </div>
          )}
          
          {/* Online Collaborators */}
          {collaborators.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-4 min-w-[180px]">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Online ({collaborators.length})
                </h4>
              </div>
              <div className="space-y-2">
                {collaborators.map((collaborator, index) => (
                  <div key={collaborator.userId || collaborator.user?._id || `collaborator-list-${index}`} className="flex items-center space-x-3 p-2 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30 shadow-sm">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm border-2 border-white"
                      style={{ backgroundColor: collaborator.cursor.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {collaborator.userName || collaborator.user?.name || 'Anonymous'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawing Stats */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <PaintBrushIcon className="h-4 w-4 mr-2 text-indigo-600" />
              Canvas Stats
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Objects:</span>
                <span className="font-medium text-gray-900">{objects.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Tool:</span>
                <span className="font-medium text-gray-900 capitalize">{tool.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium text-gray-900">{strokeWidth}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;