package com.knowledgepulse.service;

import org.springframework.stereotype.Component;

@Component
public class VectorFormatter {

    public String toPgvector(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 8 + 2);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(Float.toString(vector[i]));
        }
        sb.append(']');
        return sb.toString();
    }
}
