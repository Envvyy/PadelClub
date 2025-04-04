import React, { useState } from 'react';
import './App.css';

function BookingForm() {
  // Основные поля формы
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Слоты, полученные с сервера (GET-запрос)
  // Формат: [{ time: "9:00", courts: [ { court_id, price }, ... ] }, ...]
  const [availableSlots, setAvailableSlots] = useState([]);
  // Выбранные пользователем слоты: { time: "9:00", court: { court_id, price } }
  const [selectedBookings, setSelectedBookings] = useState([]);
  // Сообщение об ошибках или успехе
  const [formMessage, setFormMessage] = useState('');

  // Список часов (для выпадающих списков, строки вида "09:00")
  const hours = [
    '08:00','09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00',
    '18:00','19:00','20:00','21:00','22:00'
  ];

  // URL вашего FastAPI‑сервера
  const BASE_URL = 'http://109.73.201.110:8000';

  /**
   * GET-запрос для получения свободного времени корта.
   * Сервер ожидает: GET /free_time/{date}/{start_time}/{end_time}
   * start_time и end_time — целые числа (например, 9 и 16).
   */
  const handleSearch = async () => {
    setFormMessage('');
    setAvailableSlots([]);
    setSelectedBookings([]);

    if (!date || !startTime || !endTime) {
      setFormMessage('Пожалуйста, укажите дату и время');
      return;
    }

    // Извлекаем числовой час из выбранных значений (например, "09:00" → 9)
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    console.log(startHour, endHour)
    const url = `${BASE_URL}/free_time/${date}/${startHour}/${endHour}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        setFormMessage(`Ошибка: ${errorData.detail || 'Не удалось получить данные'}`);
        return;
      }
      const data = await response.json();
      // Преобразуем объект с ключами-часами (например, "9", "10") в массив слотов
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

  /**
   * Переключение выбора слота.
   * При клике добавляется/удаляется выбранный корт для определённого времени.
   */
  const toggleSelection = (slotTime, court) => {
    const exists = selectedBookings.find(
      (b) => b.time === slotTime && b.court.court_id === court.court_id
    );
    if (exists) {
      setSelectedBookings(selectedBookings.filter(
        (b) => !(b.time === slotTime && b.court.court_id === court.court_id)
      ));
    } else {
      setSelectedBookings([...selectedBookings, { time: slotTime, court }]);
    }
  };

  /**
   * POST-запрос для создания бронирования.
   * Формируется объект, соответствующий модели BookingPost:
   * {
   *   "name": "...",
   *   "email": "...",
   *   "phone": "...",
   *   "date": "YYYY-MM-DD",
   *   "total_price": <число>,
   *   "slots": { "1": [9, 10], "2": [11] }
   * }
   */
  const handleBooking = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFormMessage('Пожалуйста, укажите имя, email и телефон для бронирования');
      return;
    }
    if (selectedBookings.length === 0) {
      setFormMessage('Пожалуйста, выберите хотя бы один слот для бронирования');
      return;
    }

    // Группируем выбранные слоты по court_id, собирая массив числовых start_time
    const slotsPayload = {};
    selectedBookings.forEach(booking => {
      const hour = parseInt(booking.time.split(':')[0], 10);
      const courtId = booking.court.court_id;
      if (!slotsPayload[courtId]) {
        slotsPayload[courtId] = [];
      }
      slotsPayload[courtId].push(hour);
    });

    // Подсчитываем общую стоимость
    const totalPrice = selectedBookings.reduce(
      (sum, booking) => sum + booking.court.price, 0
    );

    const payload = {
      name,
      email,
      phone,
      date,          // в формате "YYYY-MM-DD"
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
      setFormMessage(`✅ Бронирование успешно! Перейдите по ссылке для оплаты: ${data.url}`);
    } catch (error) {
      console.error('Ошибка при отправке данных на бэкенд:', error);
      setFormMessage('Ошибка сети. Попробуйте позже.');
    }
  };

  return (
    <div className="booking-form">
      <h2>Бронирование</h2>

      {/* Выбор даты */}
      <div className="form-group">
        <label>Дата:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
        />
      </div>

      {/* Выбор времени (только часы) */}
      <div className="form-group">
        <label>Время начала:</label>
        <select
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
        >
          <option value="">Выберите время начала</option>
          {hours.map((hour, i) => (
            <option key={i} value={hour}>{hour}</option>
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
          className="input-field"
        >
          <option value="">Выберите время окончания</option>
          {hours.map((hour, i) => (
            <option key={i} value={hour}>{hour}</option>
          ))}
        </select>
      </div>

      {/* Ввод имени, email и телефона */}
      <div className="form-group">
        <label>Имя:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
          placeholder="Введите ваше имя"
        />
      </div>
      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
          placeholder="Введите ваш email"
        />
      </div>
      <div className="form-group">
        <label>Телефон:</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setFormMessage('');
          }}
          className="input-field"
          placeholder="Введите номер телефона"
        />
      </div>

      {/* Кнопка для получения свободных кортов */}
      <button onClick={handleSearch} className="btn">
        Найти доступные корты
      </button>

      {/* Вывод слотов, полученных с сервера */}
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

      {/* Вывод сообщения */}
      {formMessage && <p className="form-message">{formMessage}</p>}

      {/* Кнопка для отправки бронирования */}
      {availableSlots.length > 0 && (
        <button onClick={handleBooking} className="btn">
          Оплатить
        </button>
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
