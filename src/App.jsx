import React, { useState } from 'react';
import './App.css';

function BookingForm() {
  // Основные поля
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Храним кол-во кортов как строку, чтобы можно было стирать значение
  const [courtQuantity, setCourtQuantity] = useState("1");

  // Данные по каждому корту
  const [bookings, setBookings] = useState([
    { court: '', selectedTime: '', price: '' }
  ]);

  // Для отображения ошибок (инлайн)
  const [errors, setErrors] = useState({});
  // Для вывода общей ошибки/успешного сообщения
  const [formError, setFormError] = useState('');

  // Список доступных времён и цен
  const times = [
    { time: '10:00', price: 20 },
    { time: '12:00', price: 25 },
    { time: '14:00', price: 30 },
  ];

  // Изменение кол-ва кортов
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setFormError('');
    setErrors({});
    
    // Разрешаем поле быть пустым
    if (value === "") {
      setCourtQuantity("");
      setBookings([]);
      return;
    }
    const parsed = Number(value);
    if (!isNaN(parsed) && parsed >= 1) {
      setCourtQuantity(value);
      // Увеличиваем/уменьшаем массив бронирований
      setBookings((prev) => {
        const updated = [...prev];
        while (updated.length < parsed) {
          updated.push({ court: '', selectedTime: '', price: '' });
        }
        return updated.slice(0, parsed);
      });
    }
  };

  // Выбор корта для одного из блоков
  const handleCourtChange = (index, value) => {
    setFormError('');
    setErrors({});
    setBookings((prev) => {
      const updated = [...prev];
      updated[index] = { court: value, selectedTime: '', price: '' };
      return updated;
    });
  };

  // Выбор времени
  const handleTimeChange = (index, value) => {
    setFormError('');
    setErrors({});
    const found = times.find(t => t.time === value);
    setBookings((prev) => {
      const updated = [...prev];
      if (found) {
        updated[index].selectedTime = found.time;
        updated[index].price = found.price;
      } else {
        updated[index].selectedTime = '';
        updated[index].price = '';
      }
      return updated;
    });
  };

  // Проверка и "оплата"
  const handlePayment = () => {
    const newErrors = {};
    if (!date) newErrors.date = 'Выберите дату';
    if (!name.trim()) newErrors.name = 'Введите имя';
    if (!phone.trim()) newErrors.phone = 'Введите телефон';

    const quantityNum = Number(courtQuantity);
    if (!quantityNum || quantityNum < 1) {
      newErrors.courtQuantity = 'Укажите корректное количество кортов';
    }

    // Проверяем каждый блок
    bookings.forEach((b, i) => {
      if (!b.court) newErrors[`court-${i}`] = 'Выберите корт';
      if (!b.selectedTime) newErrors[`time-${i}`] = 'Выберите время';
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    // Если всё ОК — показываем "успешно"
    const total = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
    setFormError(`✅ Бронирование успешно! Общая цена: ${total} руб.`);
  };

  return (
    <div className="booking-form">
      <h2>Бронирование</h2>

      {/* Дата */}
      <div className="form-group">
        <label>Дата:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setFormError('');
            setErrors({});
          }}
          className="input-field"
        />
        {errors.date && <p className="error">{errors.date}</p>}
      </div>

      {/* Имя */}
      <div className="form-group">
        <label>Имя:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFormError('');
            setErrors({});
          }}
          className="input-field"
          placeholder="Введите ваше имя"
        />
        {errors.name && <p className="error">{errors.name}</p>}
      </div>

      {/* Телефон */}
      <div className="form-group">
        <label>Телефон:</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setFormError('');
            setErrors({});
          }}
          className="input-field"
          placeholder="Введите номер телефона"
        />
        {errors.phone && <p className="error">{errors.phone}</p>}
      </div>

      {/* Кол-во кортов */}
      <div className="form-group">
        <label>Количество кортов:</label>
        <input
          type="number"
          value={courtQuantity}
          onChange={handleQuantityChange}
          className="input-field"
          min="1"
        />
        {errors.courtQuantity && <p className="error">{errors.courtQuantity}</p>}
      </div>

      {/* Динамические блоки по количеству кортов */}
      {bookings.map((b, i) => (
        <div key={i} className="booking-section">
          <h4>Корт {i + 1}</h4>

          <div className="form-group">
            <label>Корт:</label>
            <select
              value={b.court}
              onChange={(e) => handleCourtChange(i, e.target.value)}
              className="input-field"
            >
              <option value="">Выберите корт</option>
              <option value="Корт 1">Корт 1</option>
              <option value="Корт 2">Корт 2</option>
              <option value="Корт 3">Корт 3</option>
            </select>
            {errors[`court-${i}`] && <p className="error">{errors[`court-${i}`]}</p>}
          </div>

          <div className="form-group">
            <label>Время:</label>
            <select
              value={b.selectedTime}
              onChange={(e) => handleTimeChange(i, e.target.value)}
              className="input-field"
              disabled={!b.court}
            >
              <option value="">Выберите время</option>
              {times.map((t) => (
                <option key={t.time} value={t.time}>
                  {t.time} ({t.price} руб.)
                </option>
              ))}
            </select>
            {errors[`time-${i}`] && <p className="error">{errors[`time-${i}`]}</p>}
          </div>
        </div>
      ))}

      {/* Общая ошибка / успех */}
      {formError && <p className="form-error">{formError}</p>}

      {/* Кнопка */}
      <button onClick={handlePayment} className="btn">
        Оплатить
      </button>
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
