package az.ingress.oauth2.springoauth2.dto;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Oauth2UserInfoDto {
    private String id;
    private String name;
    private String email;
    private String picture;
}
