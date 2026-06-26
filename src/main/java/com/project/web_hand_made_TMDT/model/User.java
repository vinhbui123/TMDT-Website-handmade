package com.project.web_hand_made_TMDT.model;

import java.time.LocalDate;
import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.OneToOne;
import jakarta.persistence.CascadeType;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String username;
    private String password;
    
    @Column(name = "first_name")
    private String firstName;
    
    @Column(name = "last_name")
    private String lastName;
    
    private String avatar;
    private LocalDate birthday;
    private String email;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    private String address;
    private int status = 1;
    private String bio;
    
    @Column(name = "create_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createAt;
    
    @Column(name = "update_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updateAt;
    
    private int role = 0;
    
    @Column(name = "auth_provider")
    private String authProvider = "local";

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private Shop shop;

    public User() {}

    @PrePersist
    protected void onCreate() {
        createAt = new Date();
        updateAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updateAt = new Date();
    }

    // Getters and Setters

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Date getCreateAt() { return createAt; }
    public void setCreateAt(Date createAt) { this.createAt = createAt; }

    public Date getUpdateAt() { return updateAt; }
    public void setUpdateAt(Date updateAt) { this.updateAt = updateAt; }

    public int getRole() { return role; }
    public void setRole(int role) { this.role = role; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public Shop getShop() { return shop; }
    public void setShop(Shop shop) { this.shop = shop; }
}
