import React, { useState } from 'react';
import './App.css';

function BookingForm() {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [formMessage, setFormMessage] = useState('');

  const BASE_URL = 'http://127.0.0.1:8000';

  const availableHours = [];
  for (let hour = 8; hour <= 23; hour++) {
    const timeString = hour.toString().padStart(2, '0') + ':00';
    availableHours.push(timeString);
  }

  const showPicker = (event) => {
    if (event.target.showPicker) {
      event.target.showPicker();
    }
  };

  const handleSearch = async () => {
    setFormMessage('');
    setAvailableSlots([]);
    setSelectedBookings([]);

    if (!date || !startTime || !endTime) {
      setFormMessage('Пожалуйста, укажите дату и время');
      return;
    }

    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const url = `${BASE_URL}/free_time/${date}/${startHour}/${endHour}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        setFormMessage(`Ошибка: ${errorData.detail || 'Не удалось получить данные'}`);
        return;
      }
      const data = await response.json();

      const slots = Object.keys(data)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(hourKey => ({
          time: hourKey + ":00",
          courts: data[hourKey]
        }));
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Ошибка при получении свободных кортов:', error);
      setFormMessage('Ошибка сети. Попробуйте позже.');
    }
  };

  const toggleSelection = (slotTime, court) => {
    const exists = selectedBookings.find(
      (b) => b.time === slotTime && b.court.court_id === court.court_id
    );
    if (exists) {
      setSelectedBookings(
        selectedBookings.filter(
          (b) => !(b.time === slotTime && b.court.court_id === court.court_id)
        )
      );
    } else {
      setSelectedBookings([...selectedBookings, { time: slotTime, court }]);
    }
  };

  const handleBooking = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFormMessage('Пожалуйста, укажите имя, email и телефон для бронирования');
      return;
    }
    if (selectedBookings.length === 0) {
      setFormMessage('Пожалуйста, выберите хотя бы один слот для бронирования');
      return;
    }

    const slotsPayload = {};
    selectedBookings.forEach(booking => {
      const hour = parseInt(booking.time.split(':')[0], 10);
      const courtId = booking.court.court_id;
      if (!slotsPayload[courtId]) {
        slotsPayload[courtId] = [];
      }
      slotsPayload[courtId].push(hour);
    });

    const totalPrice = selectedBookings.reduce(
      (sum, booking) => sum + booking.court.price,
      0
    );

    const payload = {
      name,
      email,
      phone,
      date,
      total_price: totalPrice,
      slots: slotsPayload
    };

    try {
      const response = await fetch(`${BASE_URL}/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        setFormMessage(`Ошибка: ${errorData.detail || 'Не удалось выполнить бронирование'}`);
        return;
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Ошибка при отправке данных на бэкенд:', error);
      setFormMessage('Ошибка сети. Попробуйте позже.');
    }
  };

  const totalPrice = selectedBookings.reduce(
    (sum, booking) => sum + booking.court.price,
    0
  );

  return (
    <div className="booking-form">
      <h2>Бронирование</h2>

      <div className="form-group">
        <label>Выберите дату:</label>
        <input
          type="date"
          value={date}
          onFocus={showPicker}     
          onClick={showPicker}       
          onChange={(e) => {
            setDate(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
          required
        />
      </div>

      <h3 className="time-window-subheading">
        Выберите временное окно, когда вы хотите забронировать корт:
      </h3>

      <div className="form-group">
        <label>Выберите время начала:</label>
        <select
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            setFormMessage('');
          }}
          className="input-field select-hour"
          required
        >
          <option value="">Выберите время начала</option>
          {availableHours.map((time, idx) => (
            <option key={idx} value={time}>{time}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Время окончания:</label>
        <select
          value={endTime}
          onChange={(e) => {
            setEndTime(e.target.value);
            setFormMessage('');
          }}
          className="input-field select-hour"
          required
        >
          <option value="">Выберите время окончания</option>
          {availableHours.map((time, idx) => (
            <option key={idx} value={time}>{time}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Имя (Обязательное поле):</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
          placeholder="Введите ваше имя"
          required
        />
      </div>

      <div className="form-group">
        <label>Email (Обязательное поле):</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
          placeholder="Введите ваш email"
          required
        />
      </div>

      <div className="form-group">
        <label>Телефон (Обязательное поле):</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
          placeholder="Введите номер телефона"
          required
        />
      </div>

      <button onClick={handleSearch} className="btn">
        Найти доступные корты
      </button>

      {availableSlots.length > 0 && (
        <div className="slots-container">
          <h3>Доступные слоты:</h3>
          {availableSlots.map((slot, idx) => (
            <div key={idx} className="booking-section">
              <h4>{slot.time}</h4>
              <div className="courts-container">
                {slot.courts.map((court, i) => {
                  const isSelected = selectedBookings.some(
                    (b) => b.time === slot.time && b.court.court_id === court.court_id
                  );
                  return (
                    <button
                      key={i}
                      className={`btn court-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSelection(slot.time, court)}
                    >
                      Корт {court.court_id} ({court.price} руб.)
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {formMessage && <p className="form-message">{formMessage}</p>}

      {availableSlots.length > 0 && (
        <div className="booking-summary">
          <button onClick={handleBooking} className="btn">
            Забронировать ({totalPrice} руб.)
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <BookingForm />
    </div>
  );
}

export default App;
