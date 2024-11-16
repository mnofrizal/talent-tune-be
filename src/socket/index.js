export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`User ${socket.id} left room ${room}`);
    });

    socket.on('message', (data) => {
      if (data.room) {
        socket.to(data.room).emit('message', data);
      } else {
        socket.broadcast.emit('message', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};