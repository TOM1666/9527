import { useState, useEffect, useRef } from 'react'
import './App.css'
import { fetchTasks, createTask, updateTask, deleteTask } from './taskService'
import { fetchProfile, updateProfile } from './profileService'
import { fetchGallery, addGalleryImage, deleteGalleryImage } from './galleryService'
import { useAuth } from './AuthContext'

const quotes = [
  "生活不是等待风暴过去，而是学会在雨中跳舞。",
  "每一个不曾起舞的日子，都是对生命的辜负。",
  "成功不是终点，失败也非末日，最重要的是继续前进的勇气。",
  "种一棵树最好的时间是十年前，其次是现在。",
  "星光不问赶路人，时光不负有心人。",
  "既然选择了远方，便只顾风雨兼程。",
  "你的负担将变成礼物，你受的苦将照亮你的路。",
  "只有极其努力，才能看起来毫不费力。",
  "不要等待机会，而要创造机会。",
  "行动是治愈恐惧的良药。"
]

const bgPresets = [
  { name: '紫蓝渐变', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '日落橙', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '海洋蓝', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '森林绿', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: '星空黑', value: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)' },
  { name: '樱花粉', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
]

function App() {
  const { user, logout } = useAuth()

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  })

  const [tasks, setTasks] = useState([])

  const [gallery, setGallery] = useState([])
  const [dailyQuote, setDailyQuote] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [layout, setLayout] = useState(() => localStorage.getItem('layout') || '2col')
  const [bgType, setBgType] = useState(() => localStorage.getItem('bgType') || 'preset')
  const [bgValue, setBgValue] = useState(() => localStorage.getItem('bgValue') || bgPresets[0].value)
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('bgImage') || '')
  const [brightness, setBrightness] = useState(() => localStorage.getItem('brightness') || 100)
  const [cardOpacities, setCardOpacities] = useState({})
  const [editingProfile, setEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({ ...profile })
  const [avatar, setAvatar] = useState('')
  const [taskInput, setTaskInput] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [modalImage, setModalImage] = useState(null)
  const [cardLayout, setCardLayout] = useState(() => JSON.parse(localStorage.getItem('cardLayout')) || [])
  const [bgColor1, setBgColor1] = useState('#667eea')
  const [bgColor2, setBgColor2] = useState('#764ba2')
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherOpacity, setWeatherOpacity] = useState(() => localStorage.getItem('weatherOpacity') || 100)
  const [musicTracks, setMusicTracks] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => parseInt(localStorage.getItem('currentTrackIndex')) || 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [musicOpacity, setMusicOpacity] = useState(() => localStorage.getItem('musicOpacity') || 100)

  const avatarInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const bgImageInputRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    setDailyQuote(quotes[randomIndex])
    
    fetch('/api/xc/weather')
      .then(res => res.json())
      .then(data => {
        if (data.code === '200') {
          setWeather(data.now)
        }
      })
      .catch(err => console.error('Weather fetch error:', err))

    fetchTasks()
      .then(data => {
        console.log('Fetched tasks:', data)
        setTasks(data)
      })
      .catch(err => console.error('Tasks fetch error:', err))

    fetchProfile()
      .then(data => {
        setProfile({ name: data.name || '', email: data.email || '', phone: data.phone || '', bio: data.bio || '' })
        setAvatar(data.avatar || '')
      })
      .catch(err => console.error('Profile fetch error:', err))

    fetchGallery()
      .then(data => {
        setGallery(data.map(img => img.image_data))
      })
      .catch(err => console.error('Gallery fetch error:', err))
  }, [])

  useEffect(() => {
    if (bgType === 'image' && bgImage) {
      document.body.style.background = `url(${bgImage})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundAttachment = 'fixed'
    } else if (bgValue) {
      document.body.style.background = bgValue
    }
  }, [bgType, bgValue, bgImage])

  useEffect(() => {
    document.body.style.filter = `brightness(${brightness}%)`
    localStorage.setItem('brightness', brightness)
  }, [brightness])

  useEffect(() => {
    localStorage.setItem('layout', layout)
  }, [layout])

  useEffect(() => {
    localStorage.setItem('bgType', bgType)
    localStorage.setItem('bgValue', bgValue)
    if (bgImage) localStorage.setItem('bgImage', bgImage)
  }, [bgType, bgValue, bgImage])

  useEffect(() => {
    localStorage.setItem('cardLayout', JSON.stringify(cardLayout))
  }, [cardLayout])

  useEffect(() => {
    localStorage.setItem('weatherOpacity', weatherOpacity)
  }, [weatherOpacity])

  useEffect(() => {
    localStorage.setItem('musicOpacity', musicOpacity)
  }, [musicOpacity])

  useEffect(() => {
    fetch('/api/music/list')
      .then(res => res.json())
      .then(data => {
        console.log('Music tracks:', data)
        setMusicTracks(data.tracks)
      })
      .catch(err => console.error('Music list fetch error:', err))
  }, [])

  useEffect(() => {
    localStorage.setItem('currentTrackIndex', currentTrackIndex)
  }, [currentTrackIndex])

  useEffect(() => {
    if (audioRef.current && musicTracks.length > 0) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error('Audio play error:', err))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrackIndex, musicTracks])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (musicTracks.length > 0) {
      setCurrentTrackIndex((currentTrackIndex + 1) % musicTracks.length)
    }
  }

  const playPrev = () => {
    if (musicTracks.length > 0) {
      setCurrentTrackIndex((currentTrackIndex - 1 + musicTracks.length) % musicTracks.length)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await updateProfile({ ...editForm, avatar })
      setProfile({ name: updatedProfile.name || '', email: updatedProfile.email || '', phone: updatedProfile.phone || '', bio: updatedProfile.bio || '' })
      setAvatar(updatedProfile.avatar || '')
      setEditingProfile(false)
    } catch (err) {
      console.error('Save profile error:', err)
      alert('保存个人信息失败')
    }
  }

  const handleToggleEdit = () => {
    if (!editingProfile) {
      setEditForm({ ...profile })
    }
    setEditingProfile(!editingProfile)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatar(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTask = async () => {
    if (taskInput.trim()) {
      try {
        const newTask = await createTask(taskInput, taskPriority)
        setTasks([newTask, ...tasks])
        setTaskInput('')
      } catch (err) {
        console.error('Add task error:', err)
        alert('添加任务失败，请检查后端是否运行')
      }
    }
  }

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    try {
      const updatedTask = await updateTask(id, !task.completed)
      setTasks(tasks.map(t => t.id === id ? updatedTask : t))
    } catch (err) {
      console.error('Toggle task error:', err)
    }
  }

  const deleteTaskFn = async (id) => {
    try {
      await deleteTask(id)
      setTasks(tasks.filter(t => t.id !== id))
    } catch (err) {
      console.error('Delete task error:', err)
    }
  }

  const editTask = async (id, newText) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, text: newText } : t))
  }

  const handleGalleryUpload = async (e) => {
    const files = e.target.files
    for (let file of files) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const newImage = await addGalleryImage(event.target.result)
          setGallery(prev => [...prev, newImage.image_data])
        } catch (err) {
          console.error('Gallery upload error:', err)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const deleteImage = async (index) => {
    try {
      const images = await fetchGallery()
      if (images[index]) {
        await deleteGalleryImage(images[index].id)
      }
      setGallery(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      console.error('Delete image error:', err)
    }
  }

  const applyBgPreset = (index) => {
    setBgType('preset')
    setBgValue(bgPresets[index].value)
    setBgImage('')
  }

  const applyGradient = () => {
    const gradient = `linear-gradient(135deg, ${bgColor1} 0%, ${bgColor2} 100%)`
    setBgType('gradient')
    setBgValue(gradient)
    setBgImage('')
  }

  const applyBgImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBgType('image')
        setBgImage(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const updateCardOpacity = (cardId, value) => {
    setCardOpacities(prev => ({ ...prev, [cardId]: value }))
    localStorage.setItem(`cardOpacity_${cardId}`, value)
  }

  const handleDragStart = (e, cardId) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('cardId', cardId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetCardId) => {
    e.preventDefault()
    const draggedCardId = e.dataTransfer.getData('cardId')
    if (draggedCardId !== targetCardId) {
      const container = document.getElementById('modulesContainer')
      const cards = [...container.children]
      const draggedIndex = cards.findIndex(c => c.dataset.cardId === draggedCardId)
      const targetIndex = cards.findIndex(c => c.dataset.cardId === targetCardId)
      
      const newLayout = [...cardLayout]
      const draggedItem = newLayout.find(item => item.id === draggedCardId)
      newLayout.splice(draggedIndex, 1)
      newLayout.splice(targetIndex, 0, draggedItem)
      setCardLayout(newLayout)
    }
  }

  const resetAll = () => {
    const defaultBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    document.body.style.background = defaultBg
    document.body.style.filter = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundAttachment = ''
    
    localStorage.removeItem('bgType')
    localStorage.removeItem('bgValue')
    localStorage.removeItem('bgImage')
    localStorage.removeItem('brightness')
    localStorage.removeItem('cardLayout')
    localStorage.removeItem('layout')
    localStorage.removeItem('currentTrackIndex')
    localStorage.removeItem('musicOpacity')
    
    document.querySelectorAll('.card').forEach(card => {
      const cardId = card.dataset.cardId
      localStorage.removeItem(`cardOpacity_${cardId}`)
      card.style.opacity = 1
      card.style.width = ''
      card.style.height = ''
    })
    
    setLayout('2col')
    setBrightness(100)
    setBgType('preset')
    setBgValue(defaultBg)
    setBgImage('')
    setCardOpacities({})
    setCardLayout([])
    setCurrentTrackIndex(0)
    setIsPlaying(false)
    setMusicOpacity(100)
  }

  const getCardOrder = () => {
    const defaultOrder = ['profile', 'tasks', 'gallery']
    if (cardLayout.length === 0) return defaultOrder
    return cardLayout.map(item => item.id).filter(id => defaultOrder.includes(id))
  }

  const cardOrder = getCardOrder()

  return (
    <div className="app">
      <button className="settings-btn" onClick={() => setSettingsOpen(!settingsOpen)}>⚙️</button>

      <div className={`settings-panel ${settingsOpen ? 'active' : ''}`}>
        <div className="settings-section">
          <h3><span className="icon">📐</span> 布局设置</h3>
          <div className="layout-options">
            <div className={`layout-option ${layout === '1col' ? 'active' : ''}`} onClick={() => setLayout('1col')}>
              <div className="icon">☰</div>
              <div className="label">单列</div>
            </div>
            <div className={`layout-option ${layout === '2col' ? 'active' : ''}`} onClick={() => setLayout('2col')}>
              <div className="icon">▥</div>
              <div className="label">双列</div>
            </div>
            <div className={`layout-option ${layout === '3col' ? 'active' : ''}`} onClick={() => setLayout('3col')}>
              <div className="icon">▦</div>
              <div className="label">三列</div>
            </div>
            <div className={`layout-option ${layout === 'free' ? 'active' : ''}`} onClick={() => setLayout('free')}>
              <div className="icon">⊞</div>
              <div className="label">自由</div>
            </div>
          </div>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <h3><span className="icon">🎨</span> 背景色彩</h3>
          <div className="bg-presets">
            {bgPresets.map((preset, index) => (
              <div
                key={index}
                className={`bg-preset ${bgType === 'preset' && bgValue === preset.value ? 'active' : ''}`}
                style={{ background: preset.value }}
                title={preset.name}
                onClick={() => applyBgPreset(index)}
              />
            ))}
          </div>
          <div className="bg-custom-section">
            <label>自定义渐变</label>
            <div className="bg-color-inputs">
              <input type="color" value={bgColor1} onChange={(e) => setBgColor1(e.target.value)} />
              <span>→</span>
              <input type="color" value={bgColor2} onChange={(e) => setBgColor2(e.target.value)} />
              <button className="btn" onClick={applyGradient}>应用</button>
            </div>
            <label>背景图片</label>
            <button className="bg-upload-btn" onClick={() => bgImageInputRef.current?.click()}>选择图片</button>
            <input type="file" ref={bgImageInputRef} accept="image/*" style={{ display: 'none' }} onChange={applyBgImage} />
          </div>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <h3><span className="icon">☀️</span> 亮度调节</h3>
          <div className="brightness-control">
            <span>🌙</span>
            <input 
              type="range" 
              min="50" 
              max="150" 
              value={brightness} 
              onChange={(e) => setBrightness(e.target.value)} 
            />
            <span>☀️</span>
            <span className="brightness-value">{brightness}%</span>
          </div>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <h3><span className="icon">🌤️</span> 天气透明度</h3>
          <div className="brightness-control">
            <span>👁️</span>
            <input 
              type="range" 
              min="20" 
              max="100" 
              value={weatherOpacity} 
              onChange={(e) => setWeatherOpacity(e.target.value)} 
            />
            <span className="brightness-value">{weatherOpacity}%</span>
          </div>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <h3><span className="icon">🎵</span> 播放器透明度</h3>
          <div className="brightness-control">
            <span>👁️</span>
            <input 
              type="range" 
              min="20" 
              max="100" 
              value={musicOpacity} 
              onChange={(e) => setMusicOpacity(e.target.value)} 
            />
            <span className="brightness-value">{musicOpacity}%</span>
          </div>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <h3><span className="icon">🔲</span> 卡片透明度</h3>
          <div id="cardOpacityControls">
            {cardOrder.map(cardId => {
              const savedOpacity = localStorage.getItem(`cardOpacity_${cardId}`) || 100
              const cardNames = { profile: '个人信息', tasks: '重要任务', gallery: '图库' }
              return (
                <div className="brightness-control" key={cardId} style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666', minWidth: '70px' }}>{cardNames[cardId]}</span>
                  <input 
                    type="range" 
                    min="20" 
                    max="100" 
                    value={savedOpacity} 
                    onChange={(e) => updateCardOpacity(cardId, e.target.value)} 
                  />
                  <span className="brightness-value">{savedOpacity}%</span>
                </div>
              )
            })}
          </div>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <button className="btn-danger" onClick={resetAll} style={{ width: '100%' }}>恢复所有默认设置</button>
        </div>
      </div>

      <div className="container">
        <header>
          <div className="header-top">
            <div>
              <h1>MyDate</h1>
              <p>我的个人主页</p>
            </div>
            {user && (
              <div className="user-info">
                <span>{user.username}</span>
                <button className="btn" onClick={logout}>退出</button>
              </div>
            )}
          </div>
          <p id="dailyQuote">{dailyQuote}</p>
          {weather && (
            <div className="weather-widget" style={{ opacity: weatherOpacity / 100 }}>
              <div className="weather-icon">{getWeatherIcon(weather.icon)}</div>
              <div className="weather-info">
                <div className="weather-temp">{weather.temp}°C</div>
                <div className="weather-text">{weather.text}</div>
              </div>
              <div className="weather-details">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.windDir} {weather.windScale}级</span>
                <span>🌡️ 体感 {weather.feelsLike}°C</span>
              </div>
            </div>
          )}
        </header>

        <div className={`modules layout-${layout}`} id="modulesContainer">
          {cardOrder.map(cardId => {
            if (cardId === 'profile') {
              return (
                <div 
                  className="card profile" 
                  key="profile"
                  data-card-id="profile"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'profile')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'profile')}
                  style={{ opacity: (cardOpacities['profile'] || localStorage.getItem('cardOpacity_profile') || 100) / 100 }}
                >
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="drag-handle">⋮⋮</span>
                      <h2>个人信息</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button className="btn" onClick={handleToggleEdit}>{editingProfile ? '取消' : '编辑'}</button>
                    </div>
                  </div>
                  <div className="profile-avatar" onClick={() => avatarInputRef.current?.click()}>
                    {avatar ? (
                      <img src={avatar} alt="头像" />
                    ) : (
                      <span id="avatarPlaceholder">👤</span>
                    )}
                    <input type="file" ref={avatarInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  </div>
                  {!editingProfile ? (
                    <div className="profile-info">
                      <div className="profile-field">
                        <label>姓名</label>
                        <span>{profile.name}</span>
                      </div>
                      <div className="profile-field">
                        <label>邮箱</label>
                        <span>{profile.email}</span>
                      </div>
                      <div className="profile-field">
                        <label>电话</label>
                        <span>{profile.phone}</span>
                      </div>
                      <div className="profile-field">
                        <label>简介</label>
                        <span>{profile.bio}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="edit-form active">
                      <div className="form-group">
                        <label>姓名</label>
                        <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>邮箱</label>
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>电话</label>
                        <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>简介</label>
                        <textarea rows="3" value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} />
                      </div>
                      <button className="btn" onClick={handleSaveProfile}>保存</button>
                      <button className="btn" onClick={handleToggleEdit}>取消</button>
                    </div>
                  )}
                </div>
              )
            } else if (cardId === 'tasks') {
              return (
                <div 
                  className="card" 
                  key="tasks"
                  data-card-id="tasks"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'tasks')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'tasks')}
                  style={{ opacity: (cardOpacities['tasks'] || localStorage.getItem('cardOpacity_tasks') || 100) / 100 }}
                >
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="drag-handle">⋮⋮</span>
                      <h2>重要任务</h2>
                    </div>
                  </div>
                  <ul className="task-list">
                    {tasks.map(task => (
                      <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                        <input 
                          type="checkbox" 
                          className="task-checkbox" 
                          checked={task.completed} 
                          onChange={() => toggleTask(task.id)} 
                        />
                        <span className={`task-priority priority-${task.priority}`}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                        <TaskText task={task} onEdit={editTask} />
                        <button className="task-delete" onClick={() => deleteTaskFn(task.id)}>&times;</button>
                      </li>
                    ))}
                  </ul>
                  <div className="add-task-form">
                    <input 
                      type="text" 
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      placeholder="添加新任务..." 
                    />
                    <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                      <option value="high">高优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="low">低优先级</option>
                    </select>
                    <button className="btn" onClick={addTask}>添加</button>
                  </div>
                </div>
              )
            } else if (cardId === 'gallery') {
              return (
                <div 
                  className="card" 
                  key="gallery"
                  data-card-id="gallery"
                  style={{ 
                    gridColumn: layout === '3col' ? '' : '1 / -1',
                    opacity: (cardOpacities['gallery'] || localStorage.getItem('cardOpacity_gallery') || 100) / 100 
                  }}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'gallery')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'gallery')}
                >
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="drag-handle">⋮⋮</span>
                      <h2>图库</h2>
                    </div>
                  </div>
                  <div className="gallery-grid" id="galleryGrid">
                    {gallery.map((img, index) => (
                      <div className="gallery-item" key={index}>
                        <img src={img} alt="图片" onClick={() => setModalImage(img)} />
                        <button className="delete-btn" onClick={() => deleteImage(index)}>&times;</button>
                      </div>
                    ))}
                    <div className="gallery-item gallery-upload" onClick={() => galleryInputRef.current?.click()}>
                      <span>+</span>
                      <input type="file" ref={galleryInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload} />
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>

        {musicTracks.length > 0 && (
          <div className="music-floating" style={{ opacity: musicOpacity / 100 }}>
            <div className="music-floating-name" title={musicTracks[currentTrackIndex]?.name}>
              {musicTracks[currentTrackIndex]?.name || '未知曲目'}
            </div>
            <button className="music-floating-btn" onClick={playPrev}>⏮</button>
            <button className="music-floating-btn" onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="music-floating-btn" onClick={playNext}>⏭</button>
            <audio
              ref={audioRef}
              src={`/api/music/stream/${musicTracks[currentTrackIndex]?.filename}`}
              onEnded={playNext}
            />
          </div>
        )}
      </div>

      {modalImage && (
        <div className="modal active" onClick={() => setModalImage(null)}>
          <button className="modal-close">&times;</button>
          <div className="modal-content">
            <img src={modalImage} alt="预览图片" />
          </div>
        </div>
      )}
    </div>
  )
}

function getWeatherIcon(iconCode) {
  const iconMap = {
    '100': '☀️', '101': '🌤️', '102': '⛅', '103': '🌥️', '104': '☁️',
    '300': '🌦️', '301': '🌧️', '302': '⛈️', '303': '🌩️', '304': '🌨️',
    '305': '💧', '306': '💦', '307': '🌊', '308': '🌧️', '309': '🌧️',
    '310': '🌧️', '311': '🌧️', '312': '🌧️', '313': '🌧️', '314': '🌧️',
    '315': '🌧️', '316': '🌧️', '317': '🌧️', '318': '🌧️', '350': '🌧️',
    '351': '🌧️', '399': '🌧️',
    '400': '🌨️', '401': '❄️', '402': '❄️', '403': '❄️', '404': '❄️',
    '405': '❄️', '406': '❄️', '407': '❄️', '408': '❄️', '409': '❄️',
    '410': '❄️', '456': '❄️', '457': '❄️', '499': '❄️',
    '500': '🌫️', '501': '🌫️', '502': '🌫️', '503': '🌫️', '504': '🌫️',
    '507': '🌫️', '508': '🌫️', '509': '🌫️', '510': '🌫️', '511': '🌫️',
    '512': '🌫️', '513': '🌫️', '514': '🌫️', '515': '🌫️',
    '900': '🌡️', '901': '🌡️', '999': '🌡️'
  }
  return iconMap[iconCode] || '🌤️'
}

function TaskText({ task, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(task.text)

  const handleDoubleClick = () => {
    setEditing(true)
    setText(task.text)
  }

  const handleSave = () => {
    if (text.trim()) {
      onEdit(task.id, text)
    } else {
      setText(task.text)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input 
        type="text" 
        className="task-edit-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
      />
    )
  }

  return <span className="task-text" onDoubleClick={handleDoubleClick}>{task.text}</span>
}

export default App
