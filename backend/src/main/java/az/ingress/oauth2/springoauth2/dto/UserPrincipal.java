package az.ingress.oauth2.springoauth2.dto;

import az.ingress.oauth2.springoauth2.domain.User1;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class UserPrincipal implements UserDetails {

    private String id;
    private String username;
    private String name;
    private String picture;
    private String email;
    private Collection<? extends GrantedAuthority> authorities;

    // Constructor
    public UserPrincipal(String id, String username, String name, String picture, String email, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.picture = picture;
        this.email = email;
        this.authorities = authorities;
    }

    // Static method to create UserPrincipal from User1 and OAuth2 attributes
    public static UserPrincipal create(User1 user, Map<String, Object> attributes) {
        // You can extract authorities or roles from attributes here if needed, for example:
        Collection<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")); // Example

        return new UserPrincipal(
                user.getId().toString(),
                user.getUsername(),
                user.getName(),
                user.getPicture(),
                user.getUsername(), // Assuming email is same as username
                authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities != null ? authorities : Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return null; // Not required for OAuth2
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    public String getName() {
        return this.name;
    }

    public String getEmail() {
        return this.email;
    }

    public String getPicture() {
        return this.picture;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;  // Assuming user account is never expired
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;  // Assuming user account is never locked
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;  // Assuming user credentials never expire
    }

    @Override
    public boolean isEnabled() {
        return true;  // Assuming user is always enabled
    }
}
