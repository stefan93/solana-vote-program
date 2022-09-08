
#[macro_export]
macro_rules! check_string_param {
    ($structField:expr, $min_len:expr, $max_len:expr, $action:stmt) => {

        if $structField.trim().len() < $min_len {
            msg!("Validation error: field {} is less than {}", stringify!($structField), $min_len);
            $action
        }
    
        if $structField.len() > $max_len {
            msg!("Validation error: field {} is bigger than {}", stringify!($structField), $max_len);
            $action
        }
        
    };
}

mod tests {

    use solana_program::{program_error::ProgramError, msg};
    struct Foo {
        f1: String,
    }

    #[test] 
    fn test_max_len() {
    
        let foo = Foo {
            f1: String::from("aaaa")
        };
    
        let mut val_error = false;
        check_string_param!(foo.f1, 1, 3, val_error = true);

        assert_eq!(val_error, true);
    }

    #[test] 
    fn test_min_len() {
    
        let foo = Foo {
            f1: String::from("a")
        };
    
        let mut val_error = false;
        check_string_param!(foo.f1, 2, 3, val_error = true);

        assert_eq!(val_error, true);
    }

    #[test] 
    fn test_min_non_empty_len() {
    
        let foo = Foo {
            f1: String::from("    ")
        };
    
        let mut val_error = false;
        check_string_param!(foo.f1, 2, 3, val_error = true);

        assert_eq!(val_error, true);
    }



}