-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-06-2025 a las 09:25:34
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `matatena`
--
CREATE DATABASE IF NOT EXISTS `matatena` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `matatena`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gambling`
--

DROP TABLE IF EXISTS `gambling`;
CREATE TABLE `gambling` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `dice_1` decimal(5,2) DEFAULT 16.00,
  `dice_2` decimal(5,2) DEFAULT 16.00,
  `dice_3` decimal(5,2) DEFAULT 16.00,
  `dice_4` decimal(5,2) DEFAULT 16.00,
  `dice_5` decimal(5,2) DEFAULT 16.00,
  `dice_6` decimal(5,2) DEFAULT 16.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `game`
--

DROP TABLE IF EXISTS `game`;
CREATE TABLE `game` (
  `id` bigint(20) NOT NULL,
  `code` varchar(10) NOT NULL,
  `host_user` bigint(20) NOT NULL,
  `guest_user` bigint(20) DEFAULT NULL,
  `winner` bigint(20) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plays`
--

DROP TABLE IF EXISTS `plays`;
CREATE TABLE `plays` (
  `id` bigint(20) NOT NULL,
  `match_id` bigint(20) NOT NULL,
  `move` bigint(20) NOT NULL,
  `dice` tinyint(4) NOT NULL CHECK (`dice` >= 1 and `dice` <= 6),
  `col` tinyint(4) NOT NULL CHECK (`col` >= 0 and `col` <= 2),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `users`
--
DROP TRIGGER IF EXISTS `after_user_insert_gambling`;
DELIMITER $$
CREATE TRIGGER `after_user_insert_gambling` AFTER INSERT ON `users` FOR EACH ROW BEGIN
  INSERT INTO gambling (
    user_id, dice_1, dice_2, dice_3, dice_4, dice_5, dice_6, created_at, updated_at
  ) VALUES (
    NEW.id, 16.0, 16.0, 16.0, 16.0, 16.0, 16.0, NOW(), NOW()
  );
END
$$
DELIMITER ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `gambling`
--
ALTER TABLE `gambling`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_gambling` (`user_id`);

--
-- Indices de la tabla `game`
--
ALTER TABLE `game`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `winner` (`winner`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_host_user` (`host_user`),
  ADD KEY `idx_guest_user` (`guest_user`),
  ADD KEY `idx_started_at` (`started_at`);

--
-- Indices de la tabla `plays`
--
ALTER TABLE `plays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_match_id` (`match_id`),
  ADD KEY `idx_move` (`move`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `gambling`
--
ALTER TABLE `gambling`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `game`
--
ALTER TABLE `game`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `plays`
--
ALTER TABLE `plays`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `gambling`
--
ALTER TABLE `gambling`
  ADD CONSTRAINT `gambling_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `game`
--
ALTER TABLE `game`
  ADD CONSTRAINT `game_ibfk_1` FOREIGN KEY (`host_user`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_ibfk_2` FOREIGN KEY (`guest_user`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_ibfk_3` FOREIGN KEY (`winner`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `plays`
--
ALTER TABLE `plays`
  ADD CONSTRAINT `plays_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `game` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plays_ibfk_2` FOREIGN KEY (`move`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
