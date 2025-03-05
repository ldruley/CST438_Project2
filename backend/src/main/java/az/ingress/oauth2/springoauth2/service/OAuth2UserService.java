package az.ingress.oauth2.springoauth2.service;

import az.ingress.oauth2.springoauth2.domain.User1;
import az.ingress.oauth2.springoauth2.dto.Oauth2UserInfoDto;
import az.ingress.oauth2.springoauth2.dto.UserPrincipal;
import az.ingress.oauth2.springoauth2.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @SneakyThrows
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) {
        log.trace("Load user {}", oAuth2UserRequest);
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        return processOAuth2User(oAuth2UserRequest, oAuth2User);
    }

  private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
    Oauth2UserInfoDto userInfoDto = Oauth2UserInfoDto
            .builder()
            .name(oAuth2User.getAttributes().get("name").toString())
            .id(oAuth2User.getAttributes().get("sub").toString())
            .email(oAuth2User.getAttributes().get("email").toString())
            .picture(oAuth2User.getAttributes().get("picture").toString())
            .build();

    log.trace("User info is {}", userInfoDto);
    Optional<User1> userOptional = userRepository.findByUsername(userInfoDto.getEmail());
    log.trace("User is {}", userOptional);
    User1 user = userOptional
            .map(existingUser -> updateExistingUser(existingUser, userInfoDto))
            .orElseGet(() -> registerNewUser(oAuth2UserRequest, userInfoDto));

    // Now passing attributes directly
    return (OAuth2User) UserPrincipal.create(user, oAuth2User.getAttributes());
}

    private User1 registerNewUser(OAuth2UserRequest oAuth2UserRequest, Oauth2UserInfoDto userInfoDto) {
        User1 user = new User1();
        user.setProvider(oAuth2UserRequest.getClientRegistration().getRegistrationId());
        user.setProviderId(userInfoDto.getId());
        user.setName(userInfoDto.getName());
        user.setUsername(userInfoDto.getEmail());
        user.setPicture(userInfoDto.getPicture());
        user.setId(UUID.randomUUID());
        return userRepository.save(user);
    }

    private User1 updateExistingUser(User1 existingUser, Oauth2UserInfoDto userInfoDto) {
        existingUser.setName(userInfoDto.getName());
        existingUser.setPicture(userInfoDto.getPicture());
        return userRepository.save(existingUser);
    }

}