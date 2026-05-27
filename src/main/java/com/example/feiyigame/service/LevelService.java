package com.example.feiyigame.service;

import com.example.feiyigame.model.Level;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LevelService {

    private final ObjectMapper objectMapper;
    private List<Level> levels = List.of();
    private Map<Integer, Level> levelsById = Map.of();

    public LevelService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void loadLevels() {
        try (InputStream inputStream = new ClassPathResource("data/levels.json").getInputStream()) {
            List<Level> loadedLevels = objectMapper.readValue(inputStream, new TypeReference<>() {
            });
            this.levels = loadedLevels.stream()
                    .sorted(Comparator.comparingInt(Level::getId))
                    .toList();
            this.levelsById = this.levels.stream()
                    .collect(Collectors.toUnmodifiableMap(Level::getId, level -> level));
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to load level data", exception);
        }
    }

    public List<Level> getAllLevels() {
        return levels;
    }

    public Level getLevelById(int id) {
        return levelsById.get(id);
    }

    public boolean exists(int id) {
        return levelsById.containsKey(id);
    }
}
